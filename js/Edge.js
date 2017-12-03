function Edge(ax, ay, bx, by, multiplier)
{
    this.drawn = false;
    this.ax = ax;
    this.ay = ay;
    this.bx = bx;
    this.by = by;
    this.multiplier = multiplier;
}

Edge.prototype.draw = function (c, xpos, ypos)
{
    if (this.drawn)
    {
        return;
    }

    c.moveTo(this.ax + xpos, this.ay + ypos);
    c.lineTo(this.bx + xpos, this.by + ypos);
    this.drawn = true;
}

