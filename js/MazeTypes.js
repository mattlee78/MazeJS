Maze.prototype.initRectangle = function (widthCells, heightCells, cellSize)
{
    var prevRow = null;
    var xpos = 0;
    var ypos = cellSize;

    for (var cellY = 0; cellY < heightCells; ++cellY)
    {
        var currentRow = new Array();
        var leftNeighbor = null;

        var topY = cellY * cellSize + ypos;
        var bottomY = topY + cellSize;

        var isBottomRow = (cellY >= (heightCells - 1));

        for (var cellX = 0; cellX < widthCells; ++cellX)
        {
            var leftX = cellX * cellSize + xpos;
            var rightX = leftX + cellSize;

            var leftEdge = new Edge([new Point(leftX, topY), new Point(leftX, bottomY)], 1);
            var topEdge = new Edge([new Point(leftX, topY), new Point(rightX, topY)], 1);

            var newCell = new Cell();
            currentRow.push(newCell);
            this.m_cells.push(newCell);

            if (prevRow != null)
            {
                var aboveCell = prevRow[cellX];
                newCell.addEdge(aboveCell, topEdge);
            }
            else
            {
                var topExitCell = null;
                if (cellX == 0)
                {
                    topExitCell = new Cell();
                    topExitCell.m_center = new Point(leftX + cellSize * 0.5, topY - cellSize * 0.5);
                    this.m_exitCells.push(topExitCell);
                }
                newCell.addEdge(topExitCell, topEdge);
            }
            this.m_edges.push(topEdge);

            newCell.addEdge(leftNeighbor, leftEdge);
            this.m_edges.push(leftEdge);

            if (cellX >= (widthCells - 1))
            {
                var rightEdge = new Edge([new Point(rightX, topY), new Point(rightX, bottomY)], 1);
                newCell.addEdge(bottomExitCell, rightEdge);
                this.m_edges.push(rightEdge);
            }

            if (isBottomRow)
            {
                var bottomExitCell = null;
                if (cellX >= (widthCells - 1))
                {
                    bottomExitCell = new Cell();
                    bottomExitCell.m_center = new Point(leftX + cellSize * 0.5, bottomY + cellSize * 0.5);
                    this.m_exitCells.push(bottomExitCell);
                }
                var bottomEdge = new Edge([new Point(leftX, bottomY), new Point(rightX, bottomY)], 1);
                newCell.addEdge(bottomExitCell, bottomEdge);
                this.m_edges.push(bottomEdge);
            }

            leftNeighbor = newCell;
        }

        prevRow = null;
        prevRow = currentRow;
    }

    this.computeCellCenters();
}

function makeRingEdge(radius, startAngle, arcTheta, xpos, ypos, multiplier)
{
    var pixelsPerSegment = 15;
    var circumference = 2 * Math.PI * radius;
    var segmentsPerCircle = circumference / pixelsPerSegment;
    var circlePercent = arcTheta / (2 * Math.PI);
    var arcSegmentCount = Math.max(1, segmentsPerCircle * circlePercent) | 0;
    var arcArray = new Array();
    var arcSegmentTheta = arcTheta / arcSegmentCount;
    for (var d = 0; d <= arcSegmentCount; ++d) {
        var segmentAngle = startAngle + arcSegmentTheta * d;
        var arcPosX = Math.sin(segmentAngle) * radius + xpos;
        var arcPosY = Math.cos(segmentAngle) * radius + ypos;
        var p = new Point(arcPosX, arcPosY);
        arcArray.push(p);
    }
    return new Edge(arcArray, multiplier);
}

Maze.prototype.initCircle = function (innerRingCellCount, ringCount, ringThickness, centerRadius) {
    var prevRing = null;

    centerRadius = Math.max(1, centerRadius);
    centerRadius *= ringThickness;

    var ringCellCount = innerRingCellCount;

    var firstRingCellWidth = ((centerRadius * 2 * Math.PI) / innerRingCellCount) * 0.75;

    var totalRadius = centerRadius + (ringCount * ringThickness);
    var xpos = totalRadius;
    var ypos = totalRadius + ringThickness;

    for (var ringIndex = 0; ringIndex < ringCount; ++ringIndex)
    {
        var isOuterRing = (ringIndex >= (ringCount - 1));

        var currentRing = new Array();

        var ringInnerRadius = centerRadius + ringIndex * ringThickness;
        var ringOuterRadius = ringInnerRadius + ringThickness;
        var ringCellWidth = (ringInnerRadius * 2 * Math.PI) / ringCellCount;
        var prevRingDivisor = 1;
        if ((ringCellWidth / firstRingCellWidth) > 2)
        {
            ringCellCount *= 2;
            prevRingDivisor = 2;
        }

        var leftNeighborCell = null;
        var firstRingCell = null;

        var theta = (2 * Math.PI) / ringCellCount;
        for (var cellIndex = 0; cellIndex < ringCellCount; ++cellIndex)
        {
            var leftAngle = cellIndex * theta;
            var rightAngle = leftAngle + theta;
            var innerLeftPosX = Math.sin(leftAngle) * ringInnerRadius + xpos;
            var innerLeftPosY = Math.cos(leftAngle) * ringInnerRadius + ypos;
            var outerLeftPosX = Math.sin(leftAngle) * ringOuterRadius + xpos;
            var outerLeftPosY = Math.cos(leftAngle) * ringOuterRadius + ypos;

            var ringEdge = makeRingEdge(ringInnerRadius, leftAngle, theta, xpos, ypos, 1);
            var spokeEdge = new Edge([new Point(innerLeftPosX, innerLeftPosY), new Point(outerLeftPosX, outerLeftPosY)], 10);

            var newCell = new Cell();
            this.m_cells.push(newCell);
            currentRing.push(newCell);
            if (firstRingCell == null)
            {
                firstRingCell = newCell;
            }

            newCell.addEdge(leftNeighborCell, spokeEdge);
            this.m_edges.push(spokeEdge);

            var innerNeighbor = null;
            if (prevRing != null)
            {
                innerNeighbor = prevRing[cellIndex / prevRingDivisor];
            }
            else if (cellIndex == 0)
            {
                innerNeighbor = new Cell();
                innerNeighbor.m_center = new Point(xpos, ypos);
                this.m_exitCells.push(innerNeighbor);
            }
            newCell.addEdge(innerNeighbor, ringEdge);
            this.m_edges.push(ringEdge);

            if (isOuterRing)
            {
                var outerExitCell = null;
                if (cellIndex == ((ringCellCount / 2) | 0))
                {
                    outerExitCell = new Cell();
                    var exitCenterX = Math.sin(leftAngle + theta * 0.5) * (ringOuterRadius + ringThickness * 0.5) + xpos;
                    var exitCenterY = Math.cos(leftAngle + theta * 0.5) * (ringOuterRadius + ringThickness * 0.5) + ypos;
                    outerExitCell.m_center = new Point(exitCenterX, exitCenterY);
                    this.m_exitCells.push(outerExitCell);
                }
                var outerRingEdge = makeRingEdge(ringOuterRadius, leftAngle, theta, xpos, ypos, 1);
                newCell.addEdge(outerExitCell, outerRingEdge);
                this.m_edges.push(outerRingEdge);
            }

            leftNeighborCell = newCell;
        }

        // link up first and last cells of the ring
        firstRingCell.m_neighborArray[0] = leftNeighborCell;
        leftNeighborCell.m_neighborArray.push(firstRingCell);
        leftNeighborCell.m_edgeArray.push(firstRingCell.m_edgeArray[0]);

        prevRing = null;
        prevRing = currentRing;
    }

    this.computeCellCenters();
}
