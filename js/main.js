// Your code here!

function onLoad()
{
    canvas = document.getElementById("c");
    canvas.onclick = onLeftClick;
    c = canvas.getContext("2d");

    maze = new Maze();

    maze.initRectangle(30, 30, 35, 50, 50);
    //maze.initCircle(12, 16, 30, 60, 600, 600);

    maze.solve();

    refresh();
}

function refresh()
{
    window.requestAnimationFrame(render);
}

function mouseX(e) { return e.clientX - e.target.offsetLeft; }
function mouseY(e) { return e.clientY - e.target.offsetTop; }

function onLeftClick(e)
{
    refresh();
}

function render()
{
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    c.lineWidth = 5;
    c.strokeStyle = "#000000";

    maze.draw(c);

    c.lineWidth = 3;
    c.strokeStyle = "#ff0000";

    maze.drawSolution(c, maze.getLastCell());
}

onLoad();