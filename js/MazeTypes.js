"use strict";

function createMazeProperties(mazeChangeCallback)
{
    var p = new Properties();

    var gp = p.addCategory("general", "General Options");
    var mazeTypeEnum = gp.addEnum("mazeType", "Maze Type", null, 0);

    var rp = p.addCategory("rect", "Rectangular", mazeChangeCallback);
    rp.isMaze = true;
    rp.addInteger("widthCells", "Width in Cells", 10, 1, 250);
    rp.addInteger("heightCells", "Height in Cells", 10, 1, 250);

    var cp = p.addCategory("circle", "Circular", mazeChangeCallback);
    cp.isMaze = true;
    cp.addInteger("innerRingCellCount", "Inner Ring Cell Count", 10, 4, 36);
    cp.addInteger("ringCount", "Ring Count", 6, 1, 100);
    cp.addInteger("centerRadius", "Center Radius in Rings", 2, 1, 10);

    var mazeTypeArray = [rp, cp];
    mazeTypeEnum.enumArray = mazeTypeArray;
    mazeTypeEnum.value = mazeTypeArray[0];

    return p;
}

Maze.prototype.init = function (props, printWidth)
{
    var mazeWidth = printWidth * (props.general.pageWidth.value / 100);
    var mt = props.general.mazeType.value;

    if (mt == null)
    {
        return;
    }

    switch (mt.name)
    {
        case "rect":
            {
                this.initRectangle(mt, mazeWidth);
                break;
            }
        case "circle":
            {
                this.initCircle(mt, mazeWidth);
                break;
            }
    }
}

Maze.prototype.initRectangle = function (props, mazeWidth)
{
    var cellSize = mazeWidth / props.widthCells.value;
    var prevRow = null;
    var xpos = 0;
    var ypos = cellSize / 2;

    this.m_dimensions.x = xpos + props.widthCells.value * cellSize;
    this.m_dimensions.y = ypos + (props.heightCells.value + 0.5) * cellSize;

    for (var cellY = 0; cellY < props.heightCells.value; ++cellY)
    {
        var currentRow = new Array();
        var leftNeighbor = null;

        var topY = cellY * cellSize + ypos;
        var bottomY = topY + cellSize;

        var isBottomRow = (cellY >= (props.heightCells.value - 1));

        for (var cellX = 0; cellX < props.widthCells.value; ++cellX)
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

            if (cellX >= (props.widthCells.value - 1))
            {
                var rightEdge = new Edge([new Point(rightX, topY), new Point(rightX, bottomY)], 1);
                newCell.addEdge(bottomExitCell, rightEdge);
                this.m_edges.push(rightEdge);
            }

            if (isBottomRow)
            {
                var bottomExitCell = null;
                if (cellX >= (props.widthCells.value - 1))
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

Maze.prototype.initCircle = function (props, mazeWidth)
{
    var centerRadius = Math.max(1, props.centerRadius.value);
    var numRings = centerRadius + props.ringCount.value;
    var ringThickness = mazeWidth / (numRings * 2);

    var prevRing = null;

    centerRadius *= ringThickness;

    var ringCellCount = props.innerRingCellCount.value;

    var firstRingCellWidth = ((centerRadius * 2 * Math.PI) / props.innerRingCellCount.value) * 0.75;

    var totalRadius = centerRadius + (props.ringCount.value * ringThickness);
    var xpos = totalRadius;
    var ypos = totalRadius + ringThickness / 2;

    this.m_dimensions.x = xpos + totalRadius;
    this.m_dimensions.y = ypos + totalRadius;

    for (var ringIndex = 0; ringIndex < props.ringCount.value; ++ringIndex)
    {
        var isOuterRing = (ringIndex >= (props.ringCount.value - 1));

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
