"use strict";

(function () {

    window.addEventListener("resize", resizeThrottler, false);

    var resizeTimeout;
    function resizeThrottler()
    {
        // ignore resize events as long as an actualResizeHandler execution is in the queue
        if (!resizeTimeout)
        {
            resizeTimeout = setTimeout(function () {
                resizeTimeout = null;
                actualResizeHandler();

                // The actualResizeHandler will execute at a rate of 15fps
            }, 66);
        }
    }

    function actualResizeHandler()
    {
        refresh();
    }
}());

var c = null;
var canvas = null;
var maze = null;
var showSolution = false;

function onLoad()
{
    canvas = document.getElementById("c");
    c = canvas.getContext("2d");

    window.onbeforeprint = hideControls;
    window.onafterprint = showControls;

    document.getElementById("buttonOptions").onclick = showHideOptions;
    document.getElementById("buttonPrint").onclick = printMaze;
    document.getElementById("checkShowSolution").onclick = setDrawSolution;
    document.getElementById("buttonRebuild").onclick = rebuildMaze;
    document.getElementById("selectMazeType").onchange = selectMazeType;

    maze = new Maze();

    maze.initRectangle(10, 10, 90);

    maze.build();

    refresh();
}

function selectMazeType()
{
    var s = document.getElementById("selectMazeType");
    var mt = s.value;
    switch (mt)
    {
        case "rect":
            maze.clear();
            maze.initRectangle(10, 10, 90);
            maze.build();
            break;
        case "circle":
            maze.clear();
            maze.initCircle(10, 6, 60, 2);
            maze.build();
            break;
    }
    refresh();
}

function showHideOptions()
{
    var o = document.getElementById("optionsPanel");
    o.hidden = !o.hidden;
}

function hideControls()
{
    var cb = document.getElementById("controlBar");
    cb.hidden = true;
}

function showControls()
{
    var cb = document.getElementById("controlBar");
    cb.hidden = false;
}

function rebuildMaze()
{
    if (maze != null)
    {
        maze.reset();
        maze.build();
        refresh();
    }
}

function refresh()
{
    window.requestAnimationFrame(render);
}

function mouseX(e) { return e.clientX - e.target.offsetLeft; }
function mouseY(e) { return e.clientY - e.target.offsetTop; }

function printMaze()
{
    try
    {
        window.print();
    }
    catch (err)
    {

    }
}

function setDrawSolution()
{
    var checkbox = document.getElementById("checkShowSolution");
    showSolution = checkbox.checked;
    refresh();
}

function render()
{
    c.lineCap = 'round';
    c.lineWidth = 5;
    c.strokeStyle = "#000000";

    maze.draw(c, 5, 5);

    c.lineWidth = 3;
    c.strokeStyle = "#ff0000";

    if (showSolution)
    {
        maze.drawSolution(c);
    }
}

onLoad();