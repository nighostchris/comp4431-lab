(function(imageproc) {
    "use strict";

    /*
     * Apply Kuwahara filter to the input data
     */
    imageproc.kuwahara = function(inputData, outputData, type, size, sectorSize, adaptiveNumber) {
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

        function adaptiveRegionStat(x, y) {
            var regionA, regionB, regionC, regionD;
            var rSize = regionSize;
            var rRange = regionRange;
            var div = divisor;

            for (var i = 0; i < adaptiveNumber; i++) {
                var tempA = regionStat(x - rRange, y - rRange, inputData, rRange, div);
                var tempB = regionStat(x + rRange, y - rRange, inputData, rRange, div);
                var tempC = regionStat(x - rRange, y + rRange, inputData, rRange, div);
                var tempD = regionStat(x + rRange, y + rRange, inputData, rRange, div);

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

        function circleFilterRegionStat(x, y) {
            var sSize = parseInt(sectorSize);
            var boundary = Math.trunc(size / 2);
            var sectorArray = [];
            var result = [];
            for (var i = 0; i < sSize; i++) {
                sectorArray[i] = [];
            }

            // Loop through each point and check if it is valid and which sector is it
            for (var i = x - boundary; i <= x + boundary; i++) {
                for (var j = y - boundary; j <= y + boundary; j++) {
                    var distance = Math.hypot(i - x, j - y);

                    if (distance > size / 2) {
                        continue;
                    }

                    var pixel = imageproc.getPixel(inputData, i, j);
                    var locationArray = checkPointSector(i, j, x, y, 360 / sSize);
                    for (var k = 0; k < locationArray.length; k++) {
                        sectorArray[locationArray[k] - 1].push(pixel);
                    }
                }
            }

            for (var i = 0; i < sSize; i++) {
                var meanR = 0, meanG = 0, meanB = 0;
                var divisor = sectorArray[i].length;
                var meanValue = 0;
                var variance = 0; 

                for (var j = 0; j < sectorArray[i].length; j++) {
                    /* For the mean colour */
                    var pixel = sectorArray[i][j];
                    meanR += pixel.r;
                    meanG += pixel.g;
                    meanB += pixel.b;

                    /* For the mean brightness */
                    meanValue += (pixel.r + pixel.g + pixel.b) / 3;
                }

                meanR /= divisor;
                meanG /= divisor;
                meanB /= divisor;
                meanValue /= divisor;

                for (var j = 0; j < sectorArray[i].length; j++) {
                    var pixel = sectorArray[i][j];
                    var value = (pixel.r + pixel.g + pixel.b) / 3;

                    variance += Math.pow(value - meanValue, 2);

                    variance /= divisor;
                }

                result[result.length] = {
                    mean: {r: meanR, g: meanG, b: meanB},
                    variance: variance
                };
            }
            
            return result;
        }

        /* Function to check if point is within radius and which sector it is in */
        function checkPointSector(x, y, cx, cy, sectorAngle) {
            var location = 1;
            var locationArray = [];
            var angle = (Math.atan2(y - cy, x - cx) * (180.0 / Math.PI) + 360) % 360;

            for (var i = 0; i <= 360 - sectorAngle; i += sectorAngle) {
                if (angle >= i && angle <= i + sectorAngle) {
                    locationArray.push(location);
                }

                location++;
            }

            return locationArray;
        }

        for (var y = 0; y < inputData.height; y++) {
            for (var x = 0; x < inputData.width; x++) {
                /* Find the statistics of the four sub-regions */
                var regionA, regionB, regionC, regionD;
                var sectorArray;

                switch(type) {
                    case "original":
                        regionA = regionStat(x - regionRange, y - regionRange, inputData, regionRange, divisor);
                        regionB = regionStat(x + regionRange, y - regionRange, inputData, regionRange, divisor);
                        regionC = regionStat(x - regionRange, y + regionRange, inputData, regionRange, divisor);
                        regionD = regionStat(x + regionRange, y + regionRange, inputData, regionRange, divisor);
                        break;
                    case "adaptive":
                        [regionA, regionB, regionC, regionD] = adaptiveRegionStat(x, y);
                        break;
                    case "circle":
                        sectorArray = circleFilterRegionStat(x, y);
                        break;
                    default:
                        regionA = regionStat(x - regionRange, y - regionRange, inputData, regionRange, divisor);
                        regionB = regionStat(x + regionRange, y - regionRange, inputData, regionRange, divisor);
                        regionC = regionStat(x - regionRange, y + regionRange, inputData, regionRange, divisor);
                        regionD = regionStat(x + regionRange, y + regionRange, inputData, regionRange, divisor);
                        break;
                }

                var minV;
                /* Get the minimum variance value */
                if (type == "original" || type == "adaptive") {
                    minV = Math.min(regionA.variance, regionB.variance, regionC.variance, regionD.variance);
                
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
                } else {
                    minV = Math.min.apply(null, sectorArray.map(function(a){ return a.variance; }));

                    var i = (x + y * inputData.width) * 4;

                    var targetMean;

                    sectorArray.forEach(function(a){if (a.variance == minV) targetMean = a;});

                    outputData.data[i]     = targetMean.mean.r;
                    outputData.data[i + 1] = targetMean.mean.g;
                    outputData.data[i + 2] = targetMean.mean.b;
                }
            }
        }
    }
 
}(window.imageproc = window.imageproc || {}));
