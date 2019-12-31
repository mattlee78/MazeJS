"use strict";

class Maze
{
    constructor()
    {
        this.clear();
        this.m_buildstack = new Set();
        this.m_buildarray = new Array();
        this.m_method = 1;
    }

    clear()
    {
        this.m_edges = new Array();
        this.m_cells = new Array();
        this.m_exitCells = new Array();
        this.m_dimensions = new Point(0, 0);
        this.m_barriers = new Array();
        this.m_lastTouchedCell = null;
        this.m_lastBuildVector = new Vector(0, 0);
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
        this.m_buildstack = new Set();
        this.m_buildarray = new Array();
        this.m_lastTouchedCell = null;
        this.m_lastBuildVector = new Vector(0, 0);
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

    draw(c, xpos, ypos, incremental)
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
                if (0)
                {
                    c.moveTo(cell.m_center.x-2, cell.m_center.y-2);
                    c.lineTo(cell.m_center.x+2, cell.m_center.y+2);
                    c.moveTo(cell.m_center.x - 2, cell.m_center.y + 2);
                    c.lineTo(cell.m_center.x + 2, cell.m_center.y - 2);
                }
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
        
        if (incremental)
        {
            var index = 0;
            c.font = '12px sans-serif';
            for (var cell of this.m_buildarray)
            {
                c.fillText(index.toString(), cell.m_center.x, cell.m_center.y);
                index++;
            }

            if (this.m_lastTouchedCell != null)
            {
                var cell = this.m_lastTouchedCell;
                var markSize = 4;
                c.beginPath();
                c.moveTo(cell.m_center.x - markSize, cell.m_center.y - markSize);
                c.lineTo(cell.m_center.x + markSize, cell.m_center.y + markSize);
                c.moveTo(cell.m_center.x - markSize, cell.m_center.y + markSize);
                c.lineTo(cell.m_center.x + markSize, cell.m_center.y - markSize);
                c.stroke();
            }
        }
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
    
    computeScore(dot)
    {
        switch (this.m_method)
        {
            case 0:
            {
                // straight bias
                var fwddot = ((dot + 1) * 0.5) * 5 + 1;
                return fwddot;
            }
            case 1:
            {
                // side bias
                var sidedot = 1 - Math.abs(dot);
                return Math.pow(sidedot, 3);
            }
            case 2:
            {
                // somewhat side bias
                var sidedot = 1 - Math.abs(dot);
                return (sidedot * 3) + 1;
            }
            default:
                return 1;
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
        
        var selectRandom = false;
        
        var lastRandom = false;
        if (lastRandom)
        {
            var factor = 3.5;
            var index = ((Math.random() * factor) | 0) % count;
            var itemindex = count - index - 1;
            item = this.m_buildarray[itemindex];
            this.m_buildarray.splice(itemindex, 1);
            this.m_buildstack.delete(item);
        }            
        
        var selectNeighbor = true;
        if (selectNeighbor)
        {
            var neighborEntries = new Array();
            var neighborWeights = new Array();
            var weightSum = 0;
            
            if (this.m_lastTouchedCell != null)
            {
                var ltc = this.m_lastTouchedCell;
                var neighborCount = ltc.m_neighborArray.length;
                for (var i = 0; i < neighborCount; ++i)
                {
                    var neighbor = ltc.m_neighborArray[i];
                    if (neighbor != null && !neighbor.hasBeenTouched())
                    {
                        var vecToNeighbor = neighbor.m_center.subtract(ltc.m_center);
                        vecToNeighbor.normalize();
                        var dot = vecToNeighbor.dot(this.m_lastBuildVector);
                        
                        var score = this.computeScore(dot);
                        neighborEntries.push(neighbor);
                        neighborWeights.push(score);
                        weightSum += score;
                    }
                }
                
                if (neighborEntries.length > 0)
                {
                    var x = Math.random() * weightSum;
                    for (var i = 0; i < neighborEntries.length; ++i)
                    {
                        x -= neighborWeights[i];
                        if (x <= 0)
                        {
                            item = neighborEntries[i];
                            break;
                        }
                    }
                }
            }
            
            if (item == null)
            {
                selectRandom = true;
            }
            else
            {
                this.m_buildstack.delete(item);
                for (var i = 0; i < this.m_buildarray.length; ++i)
                {
                    if (this.m_buildarray[i] == item)
                    {
                        this.m_buildarray.splice(i, 1);
                        break;
                    }
                }
            }
        }

        if (selectRandom) 
        {
            var index = (Math.random() * count) | 0;
            item = this.m_buildarray[index];
            this.m_buildarray.splice(index, 1);
            this.m_buildstack.delete(item);
        }

        return item;
    }
    
    setMethod(method)
    {
        this.m_method = method;
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
                if (neighbor == this.m_lastTouchedCell)
                {
                    touchedNeighbors = new Array();
                    touchedNeighbors.push(i);
                    break;
                }
                else
                {
                    var edge = newCell.m_edgeArray[i];
                    for (var j = 0; j < edge.multiplier; ++j)
                    {
                        touchedNeighbors.push(i);
                    }
                }
            }
        }
        var touchedNeighborCount = touchedNeighbors.length;
        var neighborIndex = (Math.random() * touchedNeighborCount) | 0;
        newCell.openEdgeByIndex(touchedNeighbors[neighborIndex]);
        this.addUntouchedNeighbors(newCell);
        
        if (this.m_lastTouchedCell != null)
        {
            var vecToNew = newCell.m_center.subtract(this.m_lastTouchedCell.m_center);
            vecToNew.normalize();
            this.m_lastBuildVector = vecToNew;
        }
        this.m_lastTouchedCell = newCell;

        return true;
    }
}
