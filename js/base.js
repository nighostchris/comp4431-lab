(function(imageproc) {
    "use strict";

    /*
     * Convert the input data to grayscale
     */
    imageproc.grayscale = function(inputData, outputData) {
        for (var i = 0; i < inputData.data.length; i += 4) {
            var value = inputData.data[i] +
                        inputData.data[i + 1] +
                        inputData.data[i + 2];
            value /= 3;

            outputData.data[i]     =
            outputData.data[i + 1] =
            outputData.data[i + 2] = value;
        }
    }

    /*
     * Make a bit mask based on the number of MSB required
     */
    function makeBitMask(bits) {
        var mask = 0;
        for (var i = 0; i < bits; i++) {
            mask >>= 1;
            mask |= 128;
        }
        return mask;
    }

    /*
     * Apply posterization to the input data
     */
    imageproc.posterization = function(inputData, outputData, redBits, greenBits, blueBits) {
        // Create the red, green and blue masks
        // A function makeBitMask() is already given
        var redMask = makeBitMask(redBits);
        var greenMask = makeBitMask(greenBits);
        var blueMask = makeBitMask(blueBits);

        // Apply the bitmasks onto the colour channels
        for (var i = 0; i < inputData.data.length; i += 4) {
            outputData.data[i]     = redMask & inputData.data[i];
            outputData.data[i + 1] = greenMask & inputData.data[i + 1];
            outputData.data[i + 2] = blueMask & inputData.data[i + 2];
        }
    }

    /*
     * Apply threshold to the input data
     */
    imageproc.threshold = function(inputData, outputData, thresholdValue) {
        for (var i = 0; i < inputData.data.length; i += 4) {
            // Find the grayscale value
            // You will apply thresholding on the grayscale value
            var grayscaleValue = inputData.data[i] +
                        inputData.data[i + 1] +
                        inputData.data[i + 2];
            grayscaleValue /= 3;
           
            // Change the colour to black or white based on the given threshold
            if (grayscaleValue > thresholdValue) {
                outputData.data[i]     = 255;
                outputData.data[i + 1] = 255;
                outputData.data[i + 2] = 255;
            } else {
                outputData.data[i]     = 0;
                outputData.data[i + 1] = 0;
                outputData.data[i + 2] = 0;
            }
        }
    }

    /*
     * Apply blur to the input data
     */
    imageproc.blur = function(inputData, outputData, kernelSize) {
        // You are given a 3x3 kernel but you need to create a proper kernel
        // using the given kernel size
        var kernel = [];
        var fill = [];

        for (var i = 0; i < kernelSize; i++) {
            fill.push(1);
        }

        for (var i = 0; i < kernelSize; i++) {
            kernel.push(fill);
        }

        // The following code applies the 3x3 kernel to the image but the code
        // has hardcoded the size so you need to make changes to allow for
        // different kernel sizes
        var kernelRange = Math.trunc(kernelSize / 2);
        var divisor = Math.pow(kernelSize, 2);

        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                var sumR = 0, sumG = 0, sumB = 0;

                /* Sum the product of the kernel on the pixels */
                for (var j = -kernelRange; j <= kernelRange; j++) {
                    for (var i = -kernelRange; i <= kernelRange; i++) {
                        var pixel = imageproc.getPixel(inputData, x + i, y + j);
                        var coeff = kernel[j + kernelRange][i + kernelRange];

                        sumR += pixel.r * coeff;
                        sumG += pixel.g * coeff;
                        sumB += pixel.b * coeff;
                    }
                }

                /* Set the averaged pixel to the output data */
                var i = (x + y * outputData.width) * 4;
                outputData.data[i]     = sumR / divisor;
                outputData.data[i + 1] = sumG / divisor;
                outputData.data[i + 2] = sumB / divisor;
            }
        }
    } 

}(window.imageproc = window.imageproc || {}));
