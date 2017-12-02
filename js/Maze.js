function Maze()
{
    this.m_edges = new Array();
    this.m_cells = new Array();
    this.m_solvestack = new Set();
    this.m_solvearray = new Array();
}

Maze.prototype.getLastCell = function ()
{
    var cellCount = this.m_cells.length;
    if (cellCount > 0)
    {
        return this.m_cells[cellCount - 1];
    }
    return null;
}

Maze.prototype.draw = function (c)
{
    for (edge of this.m_edges)
    {
        edge.drawn = false;
    }

    c.beginPath();

    for (cell of this.m_cells)
    {
        var edgeCount = cell.m_edgeArray.length;
        for (i = 0; i < edgeCount; ++i)
        {
            var mask = 1 << i;
            if ((cell.m_openEdgeMask & mask) == 0)
            {
                var edge = cell.m_edgeArray[i];
                if (!edge.drawn)
                {
                    c.moveTo(edge.ax, edge.ay);
                    c.lineTo(edge.bx, edge.by);
                    edge.drawn = true;
                }
            }
        }
    }

    c.stroke();
}

Maze.prototype.drawSolution = function (c, startCell)
{
    c.beginPath();

    var cell = startCell;
    while (cell != null)
    {
        var nextCell = cell.m_openedFromCell;
        if (nextCell != null)
        {
            c.moveTo(cell.m_centerX, cell.m_centerY);
            c.lineTo(nextCell.m_centerX, nextCell.m_centerY);
        }
        cell = nextCell;
    }

    c.stroke();
}

Maze.prototype.computeCellCenters = function ()
{
    for (cell of this.m_cells)
    {
        var x = 0;
        var y = 0;
        var pointCount = 0;
        for (edge of cell.m_edgeArray)
        {
            x += edge.ax;
            x += edge.bx;
            y += edge.ay;
            y += edge.by;
            pointCount += 2;
        }
        cell.m_centerX = x / pointCount;
        cell.m_centerY = y / pointCount;
    }
}

Maze.prototype.addUntouchedNeighbors = function (cell)
{
    for (n of cell.m_neighborArray)
    {
        if (n != null && !n.hasBeenTouched())
        {
            if (!this.m_solvestack.has(n))
            {
                this.m_solvestack.add(n);
                this.m_solvearray.push(n);
            }
        }
    }
}

Maze.prototype.getUntouchedCell = function ()
{
    if (this.m_solvearray.length == 0)
    {
        return null;
    }

    var count = this.m_solvearray.length;
    var shufflecount = count / 2;
    for (i = 0; i < shufflecount; ++i)
    {
        var indexa = (Math.random() * count) | 0;
        var indexb = (Math.random() * count) | 0;
        if (indexa != indexb)
        {
            var temp = this.m_solvearray[indexa];
            this.m_solvearray[indexa] = this.m_solvearray[indexb];
            this.m_solvearray[indexb] = temp;
        }
    }

    var item = this.m_solvearray.pop();
    this.m_solvestack.delete(item);
    return item;
}

Maze.prototype.solve = function ()
{
    this.m_solvestack.clear();

    if (this.m_cells.length == 0)
    {
        return;
    }

    var originCell = this.m_cells[0];
    var neighborCount = originCell.m_neighborArray.length;
    for (i = 0; i < neighborCount; ++i)
    {
        if (originCell.m_neighborArray[i] == null)
        {
            originCell.m_openEdgeMask |= (1 << i);
            break;
        }
    }
    this.addUntouchedNeighbors(originCell);

    while (this.m_solvearray.length > 0)
    {
        var newCell = this.getUntouchedCell();
        if (newCell == null)
        {
            break;
        }
        var touchedNeighbors = new Array();
        var neighborCount = newCell.m_neighborArray.length;
        for (i = 0; i < neighborCount; ++i)
        {
            var neighbor = newCell.m_neighborArray[i];
            if (neighbor != null && neighbor.hasBeenTouched())
            {
                touchedNeighbors.push(i);
            }
        }
        var touchedNeighborCount = touchedNeighbors.length;
        var neighborIndex = (Math.random() * touchedNeighborCount) | 0;
        newCell.openEdgeByIndex(touchedNeighbors[neighborIndex]);
        this.addUntouchedNeighbors(newCell);
    }
}

Maze.prototype.initRectangle = function (widthCells, heightCells, cellSize, xpos, ypos)
{
    var prevRow = null;

    for (cellY = 0; cellY < heightCells; ++cellY)
    {
        var currentRow = new Array();
        var leftNeighbor = null;

        var topY = cellY * cellSize + ypos;
        var bottomY = topY + cellSize;

        var isBottomRow = (cellY >= (heightCells - 1));

        for (cellX = 0; cellX < widthCells; ++cellX)
        {
            var leftX = cellX * cellSize + xpos;
            var rightX = leftX + cellSize;

            var leftEdge = new Edge(leftX, topY, leftX, bottomY);
            var topEdge = new Edge(leftX, topY, rightX, topY);

            var newCell = new Cell();
            currentRow.push(newCell);
            this.m_cells.push(newCell);

            if (isBottomRow)
            {
                var bottomEdge = new Edge(leftX, bottomY, rightX, bottomY);
                newCell.addEdge(null, bottomEdge);
                this.m_edges.push(bottomEdge);
            }
            if (cellX >= (widthCells - 1))
            {
                var rightEdge = new Edge(rightX, topY, rightX, bottomY);
                newCell.addEdge(null, rightEdge);
                this.m_edges.push(rightEdge);
            }

            newCell.addEdge(leftNeighbor, leftEdge);
            this.m_edges.push(leftEdge);
            if (prevRow != null)
            {
                var aboveCell = prevRow[cellX];
                newCell.addEdge(aboveCell, topEdge);
            }
            else
            {
                newCell.addEdge(null, topEdge);
            }
            this.m_edges.push(topEdge);

            leftNeighbor = newCell;
        }

        prevRow = null;
        prevRow = currentRow;
    }

    this.computeCellCenters();
}

Maze.prototype.initCircle = function (innerRingCellCount, ringCount, ringThickness, centerRadius, xpos, ypos) {
    var prevRing = null;

    var ringCellCount = innerRingCellCount;

    var firstRingCellWidth = ((centerRadius * 2 * Math.PI) / innerRingCellCount) * 0.75;

    for (ringIndex = 0; ringIndex < ringCount; ++ringIndex)
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
        for (cellIndex = 0; cellIndex < ringCellCount; ++cellIndex)
        {
            var leftAngle = cellIndex * theta;
            var rightAngle = leftAngle + theta;
            var innerLeftPosX = Math.sin(leftAngle) * ringInnerRadius + xpos;
            var innerLeftPosY = Math.cos(leftAngle) * ringInnerRadius + ypos;
            var innerRightPosX = Math.sin(rightAngle) * ringInnerRadius + xpos;
            var innerRightPosY = Math.cos(rightAngle) * ringInnerRadius + ypos;
            var outerLeftPosX = Math.sin(leftAngle) * ringOuterRadius + xpos;
            var outerLeftPosY = Math.cos(leftAngle) * ringOuterRadius + ypos;

            var ringEdge = new Edge(innerLeftPosX, innerLeftPosY, innerRightPosX, innerRightPosY);
            var spokeEdge = new Edge(innerLeftPosX, innerLeftPosY, outerLeftPosX, outerLeftPosY);

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
            newCell.addEdge(innerNeighbor, ringEdge);
            this.m_edges.push(ringEdge);

            if (isOuterRing)
            {
                var outerRightPosX = Math.sin(rightAngle) * ringOuterRadius + xpos;
                var outerRightPosY = Math.cos(rightAngle) * ringOuterRadius + ypos;
                var outerRingEdge = new Edge(outerLeftPosX, outerLeftPosY, outerRightPosX, outerRightPosY);
                newCell.addEdge(null, outerRingEdge);
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
