/**
 * Denon DN SC2000 DJ controller script for Mixxx 2.2+
 *
 * Copyright (C) 2021 Anatoly Arzhnikov <marodere@up4k.org>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
**/

var DenonDNSC2000 = {};

DenonDNSC2000.ledState = {
    'on':    0x4A,
    'off':   0x4B,
    'blink': 0x4C
};

DenonDNSC2000.leds = {
    'keylock': 0x08,
    'sync': 0x09,
    'cue': 0x26,
    'play': 0x27,
    'hotcue': {
        1: {
            'bright': 0x11,
            'dim': 0x12
        },
        2: {
            'bright': 0x13,
            'dim': 0x14
        },
        3: {
            'bright': 0x15,
            'dim': 0x16
        },
        4: {
            'bright': 0x17,
            'dim': 0x18
        },
        5: {
            'bright': 0x19,
            'dim': 0x1a
        },
        6: {
            'bright': 0x1b,
            'dim': 0x1c
        },
        7: {
            'bright': 0x1d,
            'dim': 0x1f
        },
        8: {
            'bright': 0x20,
            'dim': 0x21
        }
    },
    'loop_in': {
        'bright': 0x24,
        'dim': 0x3e
    },
    'loop_out': {
        'bright': 0x40,
        'dim': 0x2a
    },
    'auto_loop': {
        'bright': 0x2b,
        'dim': 0x53
    },
    'fx': {
        1: {
            'on': 0x5a,
            'cc': [
                0x5c,
                0x5d,
                0x5e,
                0x5f
            ]
        },
        2: {
            'on': 0x5b,
            'cc': [
                0x60,
                0x61,
                0x62,
                0x63
            ]
        }
    }    
};

DenonDNSC2000.fxKnobQuant = 32;

DenonDNSC2000.shiftPressed = false;

DenonDNSC2000.init = function (id, debugging) {
    for (var i = 1; i <= 2; i++) {
        DenonDNSC2000.initDeck(i);
    }
    for (var i = 1; i <= 2; i++) {
        DenonDNSC2000.initFx(i);
    }
};

DenonDNSC2000.initDeck = function (deckNumber) {
    var chGroup = '[Channel' + deckNumber + ']';
    engine.makeConnection(chGroup, 'play_indicator', DenonDNSC2000.LEDPlay).trigger();
    engine.makeConnection(chGroup, 'cue_indicator',  DenonDNSC2000.LEDCue).trigger();
    engine.makeConnection(chGroup, 'sync_enabled',   DenonDNSC2000.LEDSync).trigger();
    engine.makeConnection(chGroup, 'keylock',        DenonDNSC2000.LEDKeylock).trigger();
    for (var fxNumber = 1; fxNumber <= 2; fxNumber++) {
        engine.makeConnection('[EffectRack1_EffectUnit' + fxNumber + ']', 'group_[Channel' + deckNumber + ']_enable',
            function(fxLed) {
                return function (value, group, control) { DenonDNSC2000.LED(value, chGroup, fxLed); }
            } (DenonDNSC2000.leds['fx'][fxNumber]['on'])
        ).trigger();
    }
    engine.makeConnection(chGroup, 'loop_in', DenonDNSC2000.LEDLoopIn).trigger();
    engine.makeConnection(chGroup, 'loop_out', DenonDNSC2000.LEDLoopOut).trigger();
    engine.makeConnection(chGroup, 'loop_enabled', DenonDNSC2000.LEDLoopEnabled).trigger();
    for (var cue = 1; cue <= 8; cue++) {
        engine.makeConnection(chGroup, 'hotcue_' + cue + '_enabled',
            function (cueLed) {
                return function (value, group, control) { DenonDNSC2000.LED(value, chGroup, cueLed); }
            } (DenonDNSC2000.leds['hotcue'][cue]['bright'])
        ).trigger();
    }
};

DenonDNSC2000.initFx = function (fxNumber) {
    for (var effectNumber = 1; effectNumber <= 3; effectNumber++) {
        engine.makeConnection('[EffectRack1_EffectUnit' + fxNumber + '_Effect' + effectNumber + ']', 'enabled', function(effectLed) {
            return function (value, group, control) {
                for (var i = 1; i <= 2; i++) {
                    DenonDNSC2000.LED(value, '[Channel' + i + ']', effectLed);
                }
            }
        }(DenonDNSC2000.leds['fx'][fxNumber]['cc'][effectNumber])).trigger();
    }
};

DenonDNSC2000.LED = function (value, group, led) {
    midi.sendShortMsg(0xB0 - 1 + script.deckFromGroup(group), value ? DenonDNSC2000.ledState['on'] : DenonDNSC2000.ledState['off'], led);
};

DenonDNSC2000.MakeLEDCallback = function (ledNo) {
    return function (value, group, control) {
        DenonDNSC2000.LED(value, group, ledNo);
    };
};
DenonDNSC2000.LEDPlay    = DenonDNSC2000.MakeLEDCallback(DenonDNSC2000.leds['play']);
DenonDNSC2000.LEDCue     = DenonDNSC2000.MakeLEDCallback(DenonDNSC2000.leds['cue']);
DenonDNSC2000.LEDSync    = DenonDNSC2000.MakeLEDCallback(DenonDNSC2000.leds['sync']);
DenonDNSC2000.LEDKeylock = DenonDNSC2000.MakeLEDCallback(DenonDNSC2000.leds['keylock']);
DenonDNSC2000.LEDLoopIn  = DenonDNSC2000.MakeLEDCallback(DenonDNSC2000.leds['loop_in']['bright']);
DenonDNSC2000.LEDLoopOut = DenonDNSC2000.MakeLEDCallback(DenonDNSC2000.leds['loop_out']['bright']);
DenonDNSC2000.LEDLoopEnabled = DenonDNSC2000.MakeLEDCallback(DenonDNSC2000.leds['auto_loop']['bright']);

DenonDNSC2000.HandleShiftPress = function (channel, control, value, status, group) {
    DenonDNSC2000.shiftPressed = ((status & 0xF0) === 0x90);
}

DenonDNSC2000.HandleHotCuePress = function (channel, control, value, status, group) {
    var cue = control < 0x20 ? control - 0x16 : control - 0x1C;
    if (!DenonDNSC2000.shiftPressed) {
        engine.setValue(group, 'hotcue_' + cue + '_activate', value);
    } else {
        engine.setValue(group, 'hotcue_' + cue + '_clear', value);
    }
}

DenonDNSC2000.HandleFxValue = function (key, param, direction) {
    var fValue = engine.getValue(key, param);
    var dValue = Math.floor(fValue * DenonDNSC2000.fxKnobQuant);
    dValue += direction;
    if (0x00 <= dValue && dValue <= DenonDNSC2000.fxKnobQuant) {
        fValue = dValue / DenonDNSC2000.fxKnobQuant;
        engine.setValue(key, param, fValue);
    }
};

DenonDNSC2000.HandleFxSelect = function (key, direction) {
    if (direction > 0) {
        engine.setValue(key, 'next_effect', 1);
    } else {
        engine.setValue(key, 'prev_effect', 1);
    }
};

DenonDNSC2000.HandleFxShift = function (key, direction) {
    if (!DenonDNSC2000.shiftPressed) {
        DenonDNSC2000.HandleFxValue(key, 'meta', direction);
    } else {
        DenonDNSC2000.HandleFxSelect(key, direction);
    }
};

DenonDNSC2000.HandleFxKnob = function (value, group, control) {
    var effectNumber;
    var direction = control === 0 ? 1 : -1;
    
    if (group === 0x55) {
        DenonDNSC2000.HandleFxValue('[EffectRack1_EffectUnit1]', 'mix', direction);
    } else if (group <= 0x58) {
        effectNumber = group - 0x55;
        DenonDNSC2000.HandleFxShift('[EffectRack1_EffectUnit1_Effect' + effectNumber + ']', direction);
    } else if (group === 0x59) {
        DenonDNSC2000.HandleFxValue('[EffectRack1_EffectUnit2]', 'mix', direction);
    } else if (group <= 0x5C) {
        effectNumber = group - 0x59;
        DenonDNSC2000.HandleFxShift('[EffectRack1_EffectUnit2_Effect' + effectNumber + ']', direction);
    }
};

DenonDNSC2000.HandleSelectTrack = function (value, group, control) {
    if (control === 0) {
        engine.setValue('[Playlist]', 'SelectNextTrack', 1);
    } else {
        engine.setValue('[Playlist]', 'SelectPrevTrack', 1);
    }
};

DenonDNSC2000.HandleJogTouch = function (channel, control, value, status, group) {
    var deckNumber = script.deckFromGroup(group);
    if ((status & 0xF0) === 0x90) {
        var alpha = 1.0/8;
        var beta = alpha/32;
        engine.scratchEnable(deckNumber, 2250, 33+1/3, alpha, beta);
    } else {
        engine.scratchDisable(deckNumber);
    }
};

DenonDNSC2000.HandleJogTurn = function (channel, control, value, status, group) {
    var deckNumber = script.deckFromGroup(group);
    var newValue = value - 0x40;

    if (engine.isScratching(deckNumber)) {
        engine.scratchTick(deckNumber, newValue);
    } else {
        engine.setValue(group, 'jog', newValue);
    }
};

DenonDNSC2000.HandleBeatSize = function (channel, control, value, status, group) {
    var key = DenonDNSC2000.shiftPressed ? 'beatjump_size' : 'beatloop_size';
    var size = engine.getValue(group, key);
    size = value === 0 ? size * 2 : size / 2;
    engine.setValue(group, key, size);
};

DenonDNSC2000.shutdown = function () {
    //
};
