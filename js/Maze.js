"use strict";

function Maze()
{
    this.clear();
    this.m_buildstack = new Set();
    this.m_buildarray = new Array();
}

Maze.prototype.clear = function ()
{
    this.m_edges = new Array();
    this.m_cells = new Array();
    this.m_exitCells = new Array();
    this.m_dimensions = new Point(0, 0);
}

Maze.prototype.reset = function ()
{
    for (var cell of this.m_cells)
    {
        cell.m_openEdgeMask = 0;
        cell.m_openedFromCell = null;
    }
    for (var cell of this.m_exitCells)
    {
        cell.m_openEdgeMask = 0;
        cell.m_openedFromCell = null;
    }
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

Maze.prototype.draw = function (c, xpos, ypos)
{
    for (var edge of this.m_edges)
    {
        edge.drawn = false;
    }

    c.beginPath();

    for (var cell of this.m_cells)
    {
        var edgeCount = cell.m_edgeArray.length;
        for (var i = 0; i < edgeCount; ++i)
        {
            var mask = 1 << i;
            if ((cell.m_openEdgeMask & mask) == 0)
            {
                var edge = cell.m_edgeArray[i];
                edge.draw(c, xpos, ypos);
            }
        }
    }

    c.stroke();
}

Maze.prototype.drawSolution = function (c)
{
    var startCell = null;
    for (var exitCell of this.m_exitCells)
    {
        if (exitCell.m_openedFromCell != null)
        {
            startCell = exitCell;
            break;
        }
    }

    if (startCell == null)
    {
        return;
    }

    c.beginPath();

    var cell = startCell;
    while (cell != null)
    {
        var nextCell = cell.m_openedFromCell;
        if (nextCell != null)
        {
            c.moveTo(cell.m_center.x, cell.m_center.y);
            c.lineTo(nextCell.m_center.x, nextCell.m_center.y);
        }
        cell = nextCell;
    }

    c.stroke();
}

Maze.prototype.computeCellCenters = function ()
{
    for (var cell of this.m_cells)
    {
        var cp = new Point(0, 0);
        var pointCount = 0;
        for (var edge of cell.m_edgeArray)
        {
            var ec = edge.getCenter();
            cp.x += ec.x;
            cp.y += ec.y;
            ++pointCount;
        }
        cp.x /= pointCount;
        cp.y /= pointCount;
        cell.m_center = cp;
    }
}

Maze.prototype.addUntouchedNeighbors = function (cell)
{
    for (var n of cell.m_neighborArray)
    {
        if (n != null && !n.hasBeenTouched())
        {
            if (!this.m_buildstack.has(n))
            {
                this.m_buildstack.add(n);
                this.m_buildarray.push(n);
            }
        }
    }
}

Maze.prototype.getUntouchedCell = function ()
{
    if (this.m_buildarray.length == 0)
    {
        return null;
    }

    var count = this.m_buildarray.length;
    var shufflecount = count / 2;
    for (var i = 0; i < shufflecount; ++i)
    {
        var indexa = (Math.random() * count) | 0;
        var indexb = (Math.random() * count) | 0;
        if (indexa != indexb)
        {
            var temp = this.m_buildarray[indexa];
            this.m_buildarray[indexa] = this.m_buildarray[indexb];
            this.m_buildarray[indexb] = temp;
        }
    }

    var item = this.m_buildarray.pop();
    this.m_buildstack.delete(item);
    return item;
}

Maze.prototype.build = function ()
{
    this.m_buildstack.clear();

    if (this.m_cells.length == 0 || this.m_exitCells.length == 0)
    {
        return;
    }

    {
        var originCell = this.m_exitCells[0];
        var firstNeighbor = originCell.m_neighborArray[0];
        var neighborCount = firstNeighbor.m_neighborArray.length;
        for (var i = 0; i < neighborCount; ++i)
        {
            if (firstNeighbor.m_neighborArray[i] == originCell)
            {
                firstNeighbor.openEdgeByIndex(i);
                break;
            }
        }
        this.addUntouchedNeighbors(firstNeighbor);
    }

    while (this.m_buildarray.length > 0)
    {
        var newCell = this.getUntouchedCell();
        if (newCell == null)
        {
            break;
        }
        var touchedNeighbors = new Array();
        var neighborCount = newCell.m_neighborArray.length;
        for (var i = 0; i < neighborCount; ++i)
        {
            var neighbor = newCell.m_neighborArray[i];
            if (neighbor != null && neighbor.hasBeenTouched())
            {
                var edge = newCell.m_edgeArray[i];
                for (var j = 0; j < edge.multiplier; ++j)
                {
                    touchedNeighbors.push(i);
                }
            }
        }
        var touchedNeighborCount = touchedNeighbors.length;
        var neighborIndex = (Math.random() * touchedNeighborCount) | 0;
        newCell.openEdgeByIndex(touchedNeighbors[neighborIndex]);
        this.addUntouchedNeighbors(newCell);
    }

    canvas.width = this.m_dimensions.x + 10;
    canvas.height = this.m_dimensions.y + 10;
}
