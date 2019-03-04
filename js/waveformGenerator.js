// This object represent the waveform generator
var WaveformGenerator = {
    // The generateWaveform function takes 4 parameters:
    //     - type, the type of waveform to be generated
    //     - frequency, the frequency of the waveform to be generated
    //     - amp, the maximum amplitude of the waveform to be generated
    //     - duration, the length (in seconds) of the waveform to be generated
    generateWaveform: function(type, frequency, amp, duration) {
        var nyquistFrequency = sampleRate / 2; // Nyquist frequency
        var totalSamples = Math.floor(sampleRate * duration); // Number of samples to generate
        var result = []; // The temporary array for storing the generated samples

        switch(type) {
            case "sine-time": // Sine wave, time domain
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    result.push(amp * Math.sin(2.0 * Math.PI * frequency * currentTime));
                }

                break;

            case "square-time": // Square wave, time domain
                var oneCycle = sampleRate / frequency;
                var halfCycle = oneCycle / 2;

                for (var i = 0; i < totalSamples; ++i) {
                    var posInCycle = i % oneCycle;
                    
                    if (posInCycle < halfCycle) {
                        result.push(amp);
                    }
                    else {
                        result.push(-amp);
                    }
                }

                break;

            case "square-additive": // Square wave, additive synthesis
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sample = 0;
                    var j = 1;

                    while (j * frequency < nyquistFrequency) {
                        sample += (1.0 / j) * Math.sin(2.0 * Math.PI * j * frequency * currentTime);
                        j += 2;
                    }

                    result.push(amp * sample);
                }

                break;

            case "sawtooth-time": // Sawtooth wave, time domain
                var oneCycle = sampleRate / frequency;
                var decreaseRate = amp * 2 / oneCycle;
                
                for (var i = 0; i < totalSamples; ++i) {
                    var posInCycle = i % oneCycle;
                    result.push(amp - decreaseRate * posInCycle);
                }

                break;

            case "sawtooth-additive": // Sawtooth wave, additive synthesis
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sample = 0;
                    var j = 1;

                    while (j * frequency < nyquistFrequency) {
                        sample += (1.0 / j) * Math.sin(2.0 * Math.PI * j * frequency * currentTime);
                        ++j;
                    }

                    result.push(amp * sample);
                }

                break;

            case "triangle-additive": // Triangle wave, additive synthesis
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sample = 0;
                    var j = 1;

                    while (j * frequency < nyquistFrequency) {
                        sample += (1.0 / (j * j)) * Math.cos(2.0 * Math.PI * j * frequency * currentTime);
                        j += 2;
                    }
                    
                    result.push(amp * sample);
                }

                break;

            case "karplus-strong": // Karplus-Strong algorithm
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
                var base = $("#karplus-base>option:selected").val();
                var b = parseFloat($("#karplus-b").val());
                var delay = parseInt($("#karplus-p").val());

                break;

            case "white-noise": // White noise
                for (var i = 0; i < totalSamples; i++) {
                    result.push(Math.random() * amp * 2 - amp);
                }

                break;

            case "customized-additive-synthesis": // Customized additive synthesis
                // Obtain all the required parameters
				var harmonics = [];
				for (var h = 1; h <= 10; ++h) {
					harmonics.push($("#additive-f" + h).val());
                }
                
                for (var i = 1; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sample = 0;
                    
                    for (j = 1; j <= 10; ++j) {
                        if (j * frequency < nyquistFrequency) {
                            sample += parseFloat(harmonics[j-1]) * Math.sin(2.0 * Math.PI * j * frequency * currentTime);
                        }
                    }

                    result.push(amp * sample);
                }

                break;

            case "fm": // FM
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
                var carrierFrequency = parseInt($("#fm-carrier-frequency").val());
                var carrierAmplitude = parseFloat($("#fm-carrier-amplitude").val());
                var modulationFrequency = parseInt($("#fm-modulation-frequency").val());
                var modulationAmplitude = parseFloat($("#fm-modulation-amplitude").val());
                var useADSR = $("#fm-use-adsr").prop("checked");
                if(useADSR) { // Obtain the ADSR parameters
                    var attackDuration = parseFloat($("#fm-adsr-attack-duration").val()) * sampleRate;
                    var decayDuration = parseFloat($("#fm-adsr-decay-duration").val()) * sampleRate;
                    var releaseDuration = parseFloat($("#fm-adsr-release-duration").val()) * sampleRate;
                    var sustainLevel = parseFloat($("#fm-adsr-sustain-level").val()) / 100.0;
                }

                break;

            case "repeating-narrow-pulse": // Repeating narrow pulse
                var cycle = Math.floor(sampleRate / frequency);
                for (var i = 0; i < totalSamples; ++i) {
                    if(i % cycle === 0) {
                        result.push(amp * 1.0);
                    } else if(i % cycle === 1) {
                        result.push(amp * -1.0);
                    } else {
                        result.push(0.0);
                    }
                }
                break;

            default:
                break;
        }

        return result;
    }
};
