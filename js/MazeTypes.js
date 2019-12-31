"use strict";

function createMazeProperties(mazeChangeCallback)
{
    var p = new Properties();

    var gp = p.addCategory("general", "General Options");
    var mazeTypeEnum = gp.addEnum("mazeType", "Maze Type", null, 0);
    
    var methodA = new Object();
    methodA.displayName = "Straight";
    methodA.value = 0;
    var methodB = new Object();
    methodB.displayName = "Curvy";
    methodB.value = 1;
    var methodC = new Object();
    methodC.displayName = "Somewhat Curvy";
    methodC.value = 2;
    var mazeMethodEnum = gp.addEnum("mazeMethod", "Maze Method", [methodA, methodB, methodC], 2, mazeChangeCallback);

    var rp = p.addCategory("rect", "Rectangular", mazeChangeCallback);
    rp.isMaze = true;
    rp.addInteger("widthCells", "Width in Cells", 10, 1, 250);
    rp.addInteger("heightCells", "Height in Cells", 10, 1, 250);
    rp.addInteger("difficulty", "Difficulty", 1, 1, 5);

    var cp = p.addCategory("circle", "Circular", mazeChangeCallback);
    cp.isMaze = true;
    cp.addInteger("innerRingCellCount", "Inner Ring Cell Count", 10, 4, 36);
    cp.addInteger("ringCount", "Ring Count", 6, 1, 100);
    cp.addInteger("centerRadius", "Center Radius in Rings", 2, 1, 10);
    cp.addInteger("difficulty", "Difficulty", 1, 1, 5);

    var hp = p.addCategory("hex", "Honeycomb", mazeChangeCallback);
    hp.isMaze = true;
    hp.addInteger("widthCells", "Width in Cells", 10, 1, 250);
    hp.addInteger("heightCells", "Height in Cells", 10, 1, 250);
    hp.addInteger("difficulty", "Difficulty", 1, 1, 5);

    var mazeTypeArray = [rp, cp, hp];
    mazeTypeEnum.enumArray = mazeTypeArray;
    mazeTypeEnum.value = mazeTypeArray[0];

    return p;
}

Maze.prototype.init = function (props, printWidth)
{
    this.setMethod(props.general.mazeMethod.value.value);
    
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
        case "hex":
            {
                this.initHex(mt, mazeWidth);
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

    if (props.difficulty.value > 1)
    {
        var thirdwidth = this.m_dimensions.x / 3;
        var thirdheight = this.m_dimensions.y / 3;
        this.m_barriers.push(new Edge([new Point(thirdwidth, 0), new Point(thirdwidth, thirdheight * 2)]));
        this.m_barriers.push(new Edge([new Point(thirdwidth * 2, thirdheight), new Point(thirdwidth * 2, thirdheight * 3)]));
    }

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
            newCell.m_center = new Point(leftX + cellSize / 2, topY + cellSize / 2);
            currentRow.push(newCell);
            this.m_cells.push(newCell);

            if (prevRow != null)
            {
                var aboveCell = prevRow[cellX];
                this.addEdgeFiltered(newCell, aboveCell, topEdge);
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

            this.addEdgeFiltered(newCell, leftNeighbor, leftEdge);
            this.m_edges.push(leftEdge);

            if (cellX >= (props.widthCells.value - 1))
            {
                var rightEdge = new Edge([new Point(rightX, topY), new Point(rightX, bottomY)], 1);
                newCell.addEdge(null, rightEdge);
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

    if (props.difficulty.value > 1)
    {
        var thirdRadius = (totalRadius - centerRadius) / 3;
        var innerRadius = centerRadius + thirdRadius;
        var outerRadius = totalRadius - thirdRadius;
        var spokeCount = ((props.difficulty.value - 1) * 2) + 1;
        var spokeTheta = (Math.PI * 2) / spokeCount;
        for (var spokeIndex = 0; spokeIndex < spokeCount; ++spokeIndex)
        {
            var theta = (spokeIndex + 0) * spokeTheta;
            var ir = 0;
            var or = 0;
            if (spokeIndex % 2 == 0)
            {
                ir = innerRadius;
                or = totalRadius;
            }
            else
            {
                ir = 0;
                or = outerRadius;
            }
            this.m_barriers.push(new Edge([new Point(Math.sin(theta) * ir, Math.cos(theta) * ir), new Point(Math.sin(theta) * or, Math.cos(theta) * or)]));
        }
    }

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

            var cpAngle = (leftAngle + rightAngle) / 2;
            var cpRadius = (ringInnerRadius + ringOuterRadius) / 2;

            var ringEdge = makeRingEdge(ringInnerRadius, leftAngle, theta, xpos, ypos, 1);
            var spokeEdge = new Edge([new Point(innerLeftPosX, innerLeftPosY), new Point(outerLeftPosX, outerLeftPosY)], 10);

            var newCell = new Cell();
            newCell.m_center = new Point(Math.sin(cpAngle) * cpRadius, Math.cos(cpAngle) * cpRadius);
            this.m_cells.push(newCell);
            currentRing.push(newCell);
            if (firstRingCell == null)
            {
                firstRingCell = newCell;
            }

            this.addEdgeFiltered(newCell, leftNeighborCell, spokeEdge);
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
            this.addEdgeFiltered(newCell, innerNeighbor, ringEdge);
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

Maze.prototype.initHex = function (props, mazeWidth)
{
    //     A
    //   /   \
    // F       B
    // |   +   |
    // E       C
    //   \   / 
    //     D

    // cellSize is the width of a hex cell (F-B and E-C)
    const cellSize = mazeWidth / (props.widthCells.value + 0.5);

    const cellHalfWidth = cellSize / 2;

    // cellCornerHeight is the y height from the center of the hex to the left and right corners (F, B, E, C)
    const cellCornerHeight = cellHalfWidth / Math.sqrt(3);

    // cellHalfHeight is the y height from the center of the hex to the top and bottom corners (A, D)
    const cellHalfHeight = cellCornerHeight * 2;
    const cellRowSpacing = cellHalfHeight + cellCornerHeight;

    var prevRow = null;
    var xpos = 0;
    var ypos = cellHalfHeight;

    this.m_dimensions.x = xpos + (props.widthCells.value + 0.5) * cellSize;
    this.m_dimensions.y = ypos + ((props.heightCells.value + 1) * cellRowSpacing);

    if (props.difficulty.value > 1)
    {
        var thirdwidth = this.m_dimensions.x / 3;
        var thirdheight = this.m_dimensions.y / 3;
        this.m_barriers.push(new Edge([new Point(thirdwidth, 0), new Point(thirdwidth, thirdheight * 2)]));
        this.m_barriers.push(new Edge([new Point(thirdwidth * 2, thirdheight), new Point(thirdwidth * 2, thirdheight * 3)]));
    }

    for (var cellY = 0; cellY < props.heightCells.value; ++cellY)
    {
        var currentRow = new Array();
        var leftNeighbor = null;

        // topY is the ypos of corner A
        const topY = ypos + (cellY * cellRowSpacing);

        // bottomY is the ypos of corner D
        const bottomY = topY + (cellHalfHeight * 2);

        // topCornerY is the ypos of corners F and B
        const topCornerY = topY + cellCornerHeight;

        // bottomCornerY is the ypos of corners E and C
        const bottomCornerY = topCornerY + cellHalfHeight;

        // insetRow is true if this row is inset from the left edge by half a cell (odd numbered rows)
        var offsetX = 0;
        var insetRow = false;
        if (cellY % 2 == 1)
        {
            offsetX = cellHalfWidth;
            insetRow = true;
        }

        const isBottomRow = (cellY >= (props.heightCells.value - 1));

        for (var cellX = 0; cellX < props.widthCells.value; ++cellX)
        {
            const isRightColumn = (cellX >= (props.widthCells.value - 1));

            const leftX = cellX * cellSize + xpos + offsetX;
            const centerX = leftX + cellHalfWidth;
            const rightX = leftX + cellSize;

            var edgeEF = new Edge([new Point(leftX, topCornerY), new Point(leftX, bottomCornerY)], 1);
            var edgeFA = new Edge([new Point(leftX, topCornerY), new Point(centerX, topY)], 1);
            var edgeAB = new Edge([new Point(centerX, topY), new Point(rightX, topCornerY)], 1);

            var newCell = new Cell();
            newCell.m_center = new Point(centerX, (topCornerY + bottomCornerY) / 2);
            currentRow.push(newCell);
            this.m_cells.push(newCell);

            // topLeftCell is the cell adjoining edge F-A
            var topLeftCell = null;

            // topRightCell is the cell adjoining edge A-B
            var topRightCell = null;

            if (prevRow != null)
            {
                if (insetRow)
                {
                    topLeftCell = prevRow[cellX];
                    topRightCell = prevRow[cellX + 1];
                }
                else
                {
                    topLeftCell = prevRow[cellX - 1];
                    topRightCell = prevRow[cellX];
                }
            }
            else if (cellX == 0)
            {
                topLeftCell = new Cell();
                topLeftCell.m_center = new Point(leftX, topY - cellCornerHeight);
                this.m_exitCells.push(topLeftCell);
            }
            this.addEdgeFiltered(newCell, topLeftCell, edgeFA);
            this.addEdgeFiltered(newCell, topRightCell, edgeAB);
            this.m_edges.push(edgeFA);
            this.m_edges.push(edgeAB);

            this.addEdgeFiltered(newCell, leftNeighbor, edgeEF);
            this.m_edges.push(edgeEF);

            var edgeCD = new Edge([new Point(rightX, bottomCornerY), new Point(centerX, bottomY)], 1);
            var edgeDE = new Edge([new Point(centerX, bottomY), new Point(leftX, bottomCornerY)], 1);

            if (isRightColumn)
            {
                var edgeBC = new Edge([new Point(rightX, topCornerY), new Point(rightX, bottomCornerY)], 1);
                newCell.addEdge(null, edgeBC);
                this.m_edges.push(edgeBC);

                if (insetRow && !isBottomRow)
                {
                    newCell.addEdge(null, edgeCD);
                    this.m_edges.push(edgeCD);
                }
            }

            if (isBottomRow)
            {
                var bottomExitCell = null;

                if (isRightColumn)
                {
                    bottomExitCell = new Cell();
                    bottomExitCell.m_center = new Point(rightX, bottomY + cellCornerHeight);
                    this.m_exitCells.push(bottomExitCell);
                }

                newCell.addEdge(bottomExitCell, edgeCD);
                this.m_edges.push(edgeCD);
            }

            if (isBottomRow || (cellX == 0 && !insetRow))
            {
                newCell.addEdge(null, edgeDE);
                this.m_edges.push(edgeDE);
            }

            leftNeighbor = newCell;
        }

        prevRow = null;
        prevRow = currentRow;
    }

    this.computeCellCenters();
}