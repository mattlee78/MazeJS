function Edge(points, multiplier)
{
    this.drawn = false;
    this.points = points;
    this.multiplier = multiplier;
}

Edge.prototype.draw = function (c, xpos, ypos)
{
    if (this.drawn)
    {
        return;
    }

    c.moveTo(this.points[0].x + xpos, this.points[0].y + ypos);

    var pointCount = this.points.length;
    for (var i = 1; i < pointCount; ++i)
    {
        var p = this.points[i];
        c.lineTo(p.x + xpos, p.y + ypos);
    }

    this.drawn = true;
}

Edge.prototype.getCenter = function ()
{
    var p = new Point(0, 0);
    var pointCount = this.points.length;
    for (var i = 0; i < pointCount; ++i)
    {
        p.x += this.points[i].x;
        p.y += this.points[i].y;
    }
    p.x /= pointCount;
    p.y /= pointCount;
    return p;
}
