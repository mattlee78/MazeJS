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

var g_c = null;
var g_canvas = null;
var g_maze = null;
var g_showSolution = false;
const g_printWidth = 1100;
const g_printHeight = 1500;

function onLoad()
{
    g_canvas = document.getElementById("c");
    g_c = g_canvas.getContext("2d");

    window.onbeforeprint = hideControls;
    window.onafterprint = showControls;

    document.getElementById("buttonOptions").onclick = showHideOptions;
    document.getElementById("buttonPrint").onclick = printMaze;
    document.getElementById("checkShowSolution").onchange = setDrawSolution;
    document.getElementById("buttonRebuild").onclick = rebuildMaze;
    document.getElementById("selectMazeType").onchange = selectMazeType;

    g_maze = new Maze();

    g_maze.initRectangle(10, 13, g_printWidth/10);

    g_maze.build();

    refresh();
}

function selectMazeType()
{
    var s = document.getElementById("selectMazeType");
    var mt = s.value;
    switch (mt)
    {
        case "rect":
            g_maze.clear();
            g_maze.initRectangle(10, 13, g_printWidth/10);
            g_maze.build();
            break;
        case "circle":
            g_maze.clear();
            g_maze.initCircle(10, 6, 60, 2);
            g_maze.build();
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
    if (g_maze != null)
    {
        g_maze.reset();
        g_maze.build();
        refresh();
    }
}

function refresh()
{
    window.requestAnimationFrame(render);
}

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
    g_showSolution = this.checked;
    refresh();
}

function render()
{
    g_canvas.width = g_maze.m_dimensions.x + 10;
    g_canvas.height = g_maze.m_dimensions.y + 10;

    g_c.lineCap = 'round';
    g_c.lineWidth = 5;
    g_c.strokeStyle = "#000000";

    g_maze.draw(g_c, 5, 5);

    g_c.lineWidth = 3;
    g_c.strokeStyle = "#ff0000";

    if (g_showSolution)
    {
        g_maze.drawSolution(g_c);
    }
}

onLoad();