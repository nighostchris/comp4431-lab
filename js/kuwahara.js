(function(imageproc) {
    "use strict";

    /*
     * Apply Kuwahara filter to the input data
     */
    imageproc.kuwahara = function(inputData, outputData, type, size) {
        var regionSize, regionRange, divisor;
        
        switch(type) {
            case "original":
                regionSize = Math.trunc(size / 2) + 1;
                break;
            
            case "adaptive":
                regionSize = 3;
                break;
            
            default:
                regionSize = Math.trunc(size / 2) + 1;
                break;
        }

        regionRange = Math.trunc(regionSize / 2);
        divisor = Math.pow(regionSize, 2);
        
        /* An internal function to find the regional stat centred at (x, y) */
        function regionStat(x, y, inputData, rRange, div) {
            /* Find the mean colour and brightness */
            var meanR = 0, meanG = 0, meanB = 0;
            var meanValue = 0;
            for (var j = -rRange; j <= rRange; j++) {
                for (var i = -rRange; i <= rRange; i++) {
                    var pixel = imageproc.getPixel(inputData, x + i, y + j);

                    /* For the mean colour */
                    meanR += pixel.r;
                    meanG += pixel.g;
                    meanB += pixel.b;

                    /* For the mean brightness */
                    meanValue += (pixel.r + pixel.g + pixel.b) / 3;
                }
            }
            meanR /= div;
            meanG /= div;
            meanB /= div;
            meanValue /= div;

            /* Find the variance */
            var variance = 0;
            for (var j = -rRange; j <= rRange; j++) {
                for (var i = -rRange; i <= rRange; i++) {
                    var pixel = imageproc.getPixel(inputData, x + i, y + j);
                    var value = (pixel.r + pixel.g + pixel.b) / 3;

                    variance += Math.pow(value - meanValue, 2);
                }
            }
            variance /= div;

            /* Return the mean and variance as an object */
            return {
                mean: {r: meanR, g: meanG, b: meanB},
                variance: variance
            };
        }

        function adaptiveRegionStat() {
            var regionA, regionB, regionC, regionD;
            var rSize = regionSize;
            var rRange = regionRange;
            var div = divisor;

            for (var i = 0; i < 5; i++) {
                var tempA = regionStat(x - rRange + i, y - rRange + i, inputData, rRange + i, div);
                var tempB = regionStat(x + rRange + i, y - rRange + i, inputData, rRange + i, div);
                var tempC = regionStat(x - rRange + i, y + rRange + i, inputData, rRange + i, div);
                var tempD = regionStat(x + rRange + i, y + rRange + i, inputData, rRange + i, div);

                if (i == 0) {
                    regionA = tempA;
                    regionB = tempB;
                    regionC = tempC;
                    regionD = tempD;
                }
                else {
                    regionA = tempA.variance < regionA.variance ? tempA : regionA;
                    regionB = tempB.variance < regionB.variance ? tempB : regionB;
                    regionC = tempC.variance < regionC.variance ? tempC : regionC;
                    regionD = tempD.variance < regionD.variance ? tempD : regionD;
                }
            
                rSize += 2;
                rRange = Math.trunc(rSize / 2);
                div = Math.pow(rSize, 2);
            }

            return [regionA, regionB, regionC, regionD];
        }

        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                /* Find the statistics of the four sub-regions */
                var regionA, regionB, regionC, regionD;

                switch(type) {
                    case "original":
                        regionA = regionStat(x - regionRange, y - regionRange, inputData, regionRange, divisor);
                        regionB = regionStat(x + regionRange, y - regionRange, inputData, regionRange, divisor);
                        regionC = regionStat(x - regionRange, y + regionRange, inputData, regionRange, divisor);
                        regionD = regionStat(x + regionRange, y + regionRange, inputData, regionRange, divisor);
                        break;
                    case "adaptive":
                        [regionA, regionB, regionC, regionD] = adaptiveRegionStat();
                        break;
                    default:
                        regionA = regionStat(x - regionRange, y - regionRange, inputData, regionRange, divisor);
                        regionB = regionStat(x + regionRange, y - regionRange, inputData, regionRange, divisor);
                        regionC = regionStat(x - regionRange, y + regionRange, inputData, regionRange, divisor);
                        regionD = regionStat(x + regionRange, y + regionRange, inputData, regionRange, divisor);
                        break;
                }

                /* Get the minimum variance value */
                var minV = Math.min(regionA.variance, regionB.variance,
                                    regionC.variance, regionD.variance);

                var i = (x + y * inputData.width) * 4;

                /* Put the mean colour of the region with the minimum
                   variance in the pixel */
                switch (minV) {
                    case regionA.variance:
                        outputData.data[i]     = regionA.mean.r;
                        outputData.data[i + 1] = regionA.mean.g;
                        outputData.data[i + 2] = regionA.mean.b;
                        break;
                    case regionB.variance:
                        outputData.data[i]     = regionB.mean.r;
                        outputData.data[i + 1] = regionB.mean.g;
                        outputData.data[i + 2] = regionB.mean.b;
                        break;
                    case regionC.variance:
                        outputData.data[i]     = regionC.mean.r;
                        outputData.data[i + 1] = regionC.mean.g;
                        outputData.data[i + 2] = regionC.mean.b;
                        break;
                    case regionD.variance:
                        outputData.data[i]     = regionD.mean.r;
                        outputData.data[i + 1] = regionD.mean.g;
                        outputData.data[i + 2] = regionD.mean.b;
                }
            }
        }
    }
 
}(window.imageproc = window.imageproc || {}));
