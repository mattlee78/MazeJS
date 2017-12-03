﻿function Maze()
{
    this.m_edges = new Array();
    this.m_cells = new Array();
    this.m_buildstack = new Set();
    this.m_buildarray = new Array();
}

Maze.prototype.clear = function ()
{
    this.m_edges.clear();
    this.m_cells.clear();
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
                edge.draw(c, xpos, ypos);
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
    for (i = 0; i < shufflecount; ++i)
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

    while (this.m_buildarray.length > 0)
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
                var edge = newCell.m_edgeArray[i];
                for (j = 0; j < edge.multiplier; ++j)
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
}
