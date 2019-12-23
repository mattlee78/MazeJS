"use strict";

class Maze
{
    constructor()
    {
        this.clear();
        this.m_buildstack = new Set();
        this.m_buildarray = new Array();
    }

    clear()
    {
        this.m_edges = new Array();
        this.m_cells = new Array();
        this.m_exitCells = new Array();
        this.m_dimensions = new Point(0, 0);
        this.m_barriers = new Array();
    }

    reset()
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

    addEdgeFiltered(originCell, neighborCell, edge)
    {
        if (neighborCell != null && this.m_barriers.length > 0)
        {
            var connectEdge = new Edge([originCell.m_center, neighborCell.m_center], 1);
            for (var barrierEdge of this.m_barriers)
            {
                if (connectEdge.intersects(barrierEdge))
                {
                    originCell.addEdge(null, edge);
                    neighborCell.addEdge(null, edge);
                    return;
                }
            }
            originCell.addEdge(neighborCell, edge);
        }
        else
        {
            originCell.addEdge(neighborCell, edge);
        }
    }

    getLastCell()
    {
        var cellCount = this.m_cells.length;
        if (cellCount > 0)
        {
            return this.m_cells[cellCount - 1];
        }
        return null;
    }

    draw(c, xpos, ypos)
    {
        for (var edge of this.m_edges)
        {
            edge.drawn = false;
        }

        c.beginPath();

        for (var cell of this.m_cells)
        {
            if (cell.m_openEdgeMask == 0)
            {
                c.moveTo(cell.m_center.x-2, cell.m_center.y-2);
                c.lineTo(cell.m_center.x+2, cell.m_center.y+2);
                c.moveTo(cell.m_center.x - 2, cell.m_center.y + 2);
                c.lineTo(cell.m_center.x + 2, cell.m_center.y - 2);
                continue;
            }

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

    drawSolution(c)
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

    computeCellCenters()
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

    addUntouchedNeighbors(cell)
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

    getUntouchedCell()
    {
        var count = this.m_buildarray.length;

        if (count == 0)
        {
            return null;
        }

        var item = null;

        if (0) {
            var shufflecount = count / 2;
            for (var i = 0; i < shufflecount; ++i) {
                var indexa = (Math.random() * count) | 0;
                var indexb = (Math.random() * count) | 0;
                if (indexa != indexb) {
                    var temp = this.m_buildarray[indexa];
                    this.m_buildarray[indexa] = this.m_buildarray[indexb];
                    this.m_buildarray[indexb] = temp;
                }
            }

            item = this.m_buildarray.pop();
            this.m_buildstack.delete(item);
        }
        else
        {
            var factor = 1.5;
            var index = ((Math.random() * factor) | 0) % count;
            var itemindex = count - index - 1;
            item = this.m_buildarray[itemindex];
            this.m_buildarray.splice(itemindex, 1);
            this.m_buildstack.delete(item);
        }

        return item;
    }

    build(incremental)
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

        while (!incremental && this.buildStep()) { }
    }

    buildStep()
    {
        if (this.m_buildarray.length == 0)
        {
            return false;
        }

        var newCell = this.getUntouchedCell();
        if (newCell == null)
        {
            return false;
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

        return true;
    }
}
