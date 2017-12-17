"use strict";

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
    var pointCount = this.points.length;
    if (pointCount == 0)
    {
        return new Point(0, 0);
    }
    var p = new Point(0, 0);
    p.x = this.points[0].x;
    p.y = this.points[0].y;
    if (pointCount >= 2)
    {
        p.x += this.points[pointCount - 1].x;
        p.y += this.points[pointCount - 1].y;
        p.x /= 2;
        p.y /= 2;
    }
    return p;
}

Edge.prototype.reflectPoint = function (p)
{
    var pointA = this.points[0];
    var pointB = this.points[this.points.length - 1];

    var ex = pointB.x - pointA.x;
    var ey = pointB.y - pointA.y;
    var edgeLength = Math.sqrt(ex * ex + ey * ey);
    ex /= edgeLength;
    ey /= edgeLength;

    var vx = p.x - pointA.x;
    var vy = p.y - pointA.y;

    var dotprod = (ex * vx) + (ey * vy);
    var alignedx = dotprod * ex;
    var alignedy = dotprod * ey;
    var perpx = vx - alignedx;
    var perpy = vy - alignedy;

    var newPoint = new Point(pointA.x + alignedx - perpx, pointA.y + alignedy - perpy);
    return newPoint;
}
