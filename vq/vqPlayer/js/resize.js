// Debounce function to prevent excessive resize calls
function debounce(func, wait) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}

$(window).on("resize", debounce(resizeWindow, 100));
$(document).ready(resizeWindow); // Ensure it runs on page load too
function resizeWindow() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    let stageWidth, stageHeight, stageLeft, stageTop;
    let coverTop, coverBottom, coverLeft, coverRight;

    if ((w / h) >= 4 / 3) {
        stageHeight = h;
        stageWidth = (4 / 3) * h;
        stageLeft = (w - stageWidth) / 2;
        stageTop = 0;
        coverTop = 0;
        coverBottom = 0;
        coverLeft = stageLeft;
        coverRight = stageLeft;
    } else {
        stageWidth = w;
        stageHeight = (3 / 4) * w;
        stageTop = (h - stageHeight) / 2;
        stageLeft = 0;
        coverTop = stageTop;
        coverBottom = stageTop;
        coverLeft = 0;
        coverRight = 0;
    }

    $(".screen").css({
        width: `${stageWidth}px`,
        height: `${stageHeight}px`,
        left: `${stageLeft}px`,
        top: `${stageTop}px`
    });

    $("#coverTop").css({
        width: `${w}px`,
        height: `${coverTop}px`,
        top: "0px",
        left: "0px"
    });

    $("#coverBottom").css({
        width: `${w}px`,
        height: `${coverBottom}px`,
        top: `${h - coverBottom}px`,
        left: "0px"
    });

    $("#coverLeft").css({
        width: `${coverLeft}px`,
        height: `${h}px`,
        top: "0px",
        left: "0px"
    });

    $("#coverRight").css({
        width: `${coverRight}px`,
        height: `${h}px`,
        top: "0px",
        left: `${w - coverRight}px`
    });

    // Corner radii
    const cornerSize = 0.025 * stageHeight;
    $(".rounded").css("border-radius", `${cornerSize}px`);

    const cornerSize2 = 0.05 * stageHeight;
    $(".roundedRight").css({
        "border-top-right-radius": `${cornerSize2}px`,
        "border-bottom-right-radius": `${cornerSize2}px`
    });

    // Font sizes
    for (let i = 1; i <= 1000; i++) {
        $(`.fs-${i}`).css("font-size", `${(stageHeight * i) / 1000}px`);
    }

    // Stripe sizing (fix background-size)
    const stripeSize = stageHeight * 0.05;
    $(".stripes").css("background-size", `${stripeSize}px ${stripeSize}px`);

    // Border
    const borderSize = stageHeight * 0.003;
    $("#fillInAnswer").css("border", `${borderSize}px solid white`);

    // Root font size
    $("html").css("font-size", `${stageHeight / 20}px`);
}

// Debounce function to prevent excessive resize calls
function debounce(func, wait) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}
