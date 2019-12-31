"use strict";

class Point
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
	
	subtract(op)
	{
		var r = new Vector(this.x - op.x, this.y - op.y);
		return r;
	}
}

class Vector
{
	constructor(x, y)
	{
        this.x = x;
        this.y = y;
	}
	
	normalize()
	{
		var lengthsq = (this.x * this.x) + (this.y * this.y);
		var length = Math.sqrt(lengthsq);
		this.x /= length;
		this.y /= length;
	}
    
    dot(ov)
    {
        return (this.x * ov.x) + (this.y * ov.y);
    }
}

