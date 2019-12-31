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
var g_props = null;
var g_maze = null;
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
    document.addEventListener("keydown", handleKeyDown);

    g_props = createMazeProperties(rebuildMazeNewOptions);
    var gp = g_props.general;
    gp.mazeType.changeCallback = selectMazeType;
    gp.addBoolean("showSolution", "Show Solution", false, refresh);
    gp.addButton("rebuildButton", "Rebuild Maze", rebuildMaze);
    gp.addBoolean("incrementalBuild", "Incremental Build", false, rebuildMaze);
    gp.addButton("stepButton", "Build Step", stepMaze);
    gp.addInteger("lineWidth", "Line Width", 5, 1, 10, refresh);
    gp.addInteger("pageWidth", "Page Width of Maze (Percent)", 100, 10, 100, rebuildMazeNewOptions);

    var optionsPanel = document.getElementById("optionsPanel");
    buildOptionsUI(optionsPanel, g_props);

    g_maze = new Maze();
    selectMazeType(gp.mazeType);
}

function handleKeyDown(event)
{
    switch (event.keyCode)
    {
        case 73:
            g_props.general.incrementalBuild.value = !g_props.general.incrementalBuild.value;
            rebuildMaze();
            break;
        case 82:
            rebuildMaze();
            break;
        case 83:
            stepMaze();
            break;
    }
}

function rebuildMazeNewOptions()
{
    if (g_maze != null)
    {
        g_maze.clear();
        g_maze.init(g_props, g_printWidth);
        g_maze.build();
        refresh();
    }
}

function selectMazeType(props)
{
    for (var mt of props.enumArray)
    {
        var groupDiv = mt.groupDiv;
        var isSelectedMazeType = (mt == props.value);
        groupDiv.hidden = !isSelectedMazeType;
    }
    rebuildMazeNewOptions();
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
        g_maze.build(g_props.general.incrementalBuild.value);
        refresh();
    }
}

function stepMaze()
{
    if (g_maze != null)
    {
        g_maze.buildStep();
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

function render()
{
    g_canvas.width = g_maze.m_dimensions.x + 10;
    g_canvas.height = g_maze.m_dimensions.y + 10;

    g_c.lineCap = 'round';
    g_c.lineWidth = g_props.general.lineWidth.value;
    g_c.strokeStyle = "#000000";
    
    g_c.fillStyle = 'black';

    g_maze.draw(g_c, 5, 5, g_props.general.incrementalBuild.value);

    if (g_props.general.showSolution.value)
    {
        g_c.lineWidth = g_props.general.lineWidth.value - 2;
        g_c.strokeStyle = "#ff0000";
        g_maze.drawSolution(g_c);
    }
}

onLoad();