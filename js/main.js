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

function onLoad()
{
    canvas = document.getElementById("c");
    canvas.onclick = onLeftClick;
    c = canvas.getContext("2d");

    maze = new Maze();

    //maze.initRectangle(10, 10, 90);
    maze.initCircle(10, 6, 60, 2);

    maze.build();

    refresh();
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

function onLeftClick(e)
{
    printMaze();
}

function render()
{
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    c.lineCap = 'round';
    c.lineWidth = 5;
    c.strokeStyle = "#000000";

    maze.draw(c, 5, 5);

    c.lineWidth = 3;
    c.strokeStyle = "#ff0000";

    maze.drawSolution(c);
}

onLoad();