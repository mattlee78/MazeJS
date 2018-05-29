"use strict";

function cross2d(ax, ay, bx, by)
{
    return (ax * by) - (ay * bx);
}

class Edge
{
    constructor(points, multiplier)
    {
        this.drawn = false;
        this.points = points;
        this.multiplier = multiplier;
    }

    draw(c, xpos, ypos)
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

    getCenter()
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

    reflectPoint(p)
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

    intersects(otherEdge) {
        var pointEA = this.points[0];
        var pointEB = this.points[this.points.length - 1];
        var ax = pointEB.x - pointEA.x;
        var ay = pointEB.y - pointEA.y;
        var pointOA = otherEdge.points[0];
        var pointOB = otherEdge.points[otherEdge.points.length - 1];
        var bx = pointOB.x - pointOA.x;
        var by = pointOB.y - pointOA.y;
        var cx = pointEA.x - pointOA.x;
        var cy = pointEA.y - pointOA.y;

        var m = cross2d(ax, ay, bx, by);
        var n = cross2d(bx, by, cx, cy);

        if (Math.abs(m) < 0.0001 || Math.abs(n) < 0.0001)
        {
            return false;
        }

        var s = n / m;

        var ix = s * ax + pointEA.x;
        var iy = s * ay + pointEA.y;

        if (s < 0 || s >= 1)
        {
            return false;
        }

        var r = -1;
        if (bx > 0)
        {
            r = (ix - pointOA.x) / bx;
        }
        else
        {
            r = (iy - pointOA.y) / by;
        }

        if (r < 0 || r >= 1)
        {
            return false;
        }

        return true;
    }
}
