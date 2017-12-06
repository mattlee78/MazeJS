function Cell()
{
    this.m_center = new Point(0, 0);
    this.m_edgeArray = new Array();
    this.m_neighborArray = new Array();
    this.m_openEdgeMask = 0;
    this.m_openedFromCell = null;
}

Cell.prototype.hasBeenTouched = function ()
{
    return this.m_openEdgeMask != 0;
}

Cell.prototype.addEdge = function (neighbor, edge)
{
    this.m_neighborArray.push(neighbor);
    this.m_edgeArray.push(edge);
    if (neighbor != null)
    {
        neighbor.m_neighborArray.push(this);
        neighbor.m_edgeArray.push(edge);
    }
}

Cell.prototype.openEdgeByIndex = function (index)
{
    var mask = 1 << index;
    if ((this.m_openEdgeMask & mask) == 0) {
        this.m_openEdgeMask |= mask;
        var neighbor = this.m_neighborArray[index];
        neighbor.openEdge(this);
        this.m_openedFromCell = neighbor;
    }
}

Cell.prototype.openEdge = function (neighbor)
{
    var neighborCount = this.m_neighborArray.length;
    for (var i = 0; i < neighborCount; ++i)
    {
        if (this.m_neighborArray[i] == neighbor)
        {
            this.m_openEdgeMask |= 1 << i;
            return;
        }
    }
}
