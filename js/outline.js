(function(imageproc) {
    "use strict";

    /*
     * Apply sobel edge to the input data
     */
    imageproc.sobelEdge = function(inputData, outputData, threshold) {
        /* Initialize the two edge kernel Gx and Gy */
        var Gx = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        var Gy = [
            [-1,-2,-1],
            [ 0, 0, 0],
            [ 1, 2, 1]
        ];
        
        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                var sumRX = 0, sumGX = 0, sumBX = 0;
                var sumRY = 0, sumGY = 0, sumBY = 0;

                /* Sum the product of the kernel on the pixels */
                for (var j = -1; j <= 1; j++) {
                    for (var i = -1; i <= 1; i++) {
                        var pixel = imageproc.getPixel(inputData, x + i, y + j);
                        var coeffX = Gx[j + 1][i + 1];
                        var coeffY = Gy[j + 1][i + 1];

                        sumRX += pixel.r * coeffX;
                        sumGX += pixel.g * coeffX;
                        sumBX += pixel.b * coeffX;

                        sumRY += pixel.r * coeffY;
                        sumGY += pixel.g * coeffY;
                        sumBY += pixel.b * coeffY;
                    }
                }

                var i = (x + y * outputData.width) * 4;
                outputData.data[i]     = Math.hypot(sumRX, sumRY);
                outputData.data[i + 1] = Math.hypot(sumGX, sumGY);
                outputData.data[i + 2] = Math.hypot(sumBX, sumBY);

                /* Apply thresholding on the outputData */
                var grayscaleValue = outputData.data[i] +
                        outputData.data[i + 1] +
                        outputData.data[i + 2];
                grayscaleValue /= 3;

                if (grayscaleValue > threshold) {
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
    } 

}(window.imageproc = window.imageproc || {}));
