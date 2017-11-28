var listData = [];
var netID = "";
var timeChecked = -1;

$(function () {
    login();
    initUpdateLoop();
});

function login() {
    var hash = window.location.search;
    console.log(hash)
    var quizAuthorList = hash.substring(1, hash.length).split(";");
    var quizList = [];
    for (var i = 0; i < quizAuthorList.length; i++) {
        var q = {};
        var authorData = quizAuthorList[i].split(":");
        q.author = authorData[0];
        q.quizzes = authorData[1].split(",");
        for (var j = 0; j < q.quizzes.length; j++) {
            q.quizzes[j] = {
                "id": q.quizzes[j]
            }
        }
        quizList[i] = q;
    }
    console.log(quizList);
    $.ajax({
        url: "login.php",
        dataType: "json",
        data: {
            'quizList': JSON.stringify(quizList)
        }
    }).done(function (data) {
        console.log("OK");
        console.log(data);
        listData = data.listData;
        netID = data.netID;
        generateList();
    }).fail(function () {
        console.log("Failed");
    });
}

function generateList() {
    $("#quizzes").empty();
    var count = 0;
    var totalQuizzes = 0;
    var completedQuizzes = 0;
    for (var i = 0; i < listData.length; i++) {
        for (var j = 0; j < listData[i].quizzes.length; j++) {
            var q = listData[i].quizzes[j];
            $("#quizzes").append('<div id="quiz' + count + '" class="quiz"></div>');
            $("#quiz" + count).append('<div id="quizIcon' + count + '" class="quizIcon"></div>');
            $("#quiz" + count).append('<div id="quizTitle' + count + '" class="quizTitle text fs-40"></div>');
            totalQuizzes++;
            if (q.completed == "true") {
                $("#quizIcon" + count).addClass("quizCompleteIcon");
                completedQuizzes++;
            } else {
                $("#quizIcon" + count).addClass("quizIncompleteIcon");
            }
            $("#quizTitle" + count).text(q.title);
            $("#quiz" + count).css("top", (10 * count) + "%");
            initQuizBoxClick(count, q.quizLink);
            count++;
        }
    }
    $("#nameText").text(netID);
    if (completedQuizzes != totalQuizzes) {
        $("#completedText").text("Completed " + completedQuizzes + " of " + totalQuizzes + ".");
    } else {
        $("#completedText").addClass("greenText");
        $("#completedText").text("Completed all " + totalQuizzes + "!");
    }
    timeChecked = new Date().getTime();
    updateLoop();
    resizeWindow();
}

function initQuizBoxClick(count, quizLink) {
    $("#quiz" + count).click(function () {
        window.open(quizLink);
    });
}

function initUpdateLoop() {
    updateLoop();
    setInterval(updateLoop, 15000);
}

function updateLoop() {
    if (timeChecked > -1) {
        var currentTime = new Date().getTime();
        var secondsSinceUpdate = Math.round((currentTime - timeChecked) / 1000);
        var minutesSinceUpdate = Math.round(secondsSinceUpdate / 60);
        var hoursSinceUpdate = Math.round(minutesSinceUpdate / 60);
        var timeText = "";
        if (secondsSinceUpdate == 0) {
            timeText = "(last updated just now)";
        } else if (secondsSinceUpdate < 60) {
            timeText = "(last updated ~" + secondsSinceUpdate + " second" + (secondsSinceUpdate == 1 ? "" : "s") + " ago)";
        } else if (secondsSinceUpdate < 3600) {
            timeText = "(last updated ~" + minutesSinceUpdate + " minute" + (minutesSinceUpdate == 1 ? "" : "s") + " ago)";
        } else {
            timeText = "(last updated ~" + hoursSinceUpdate + " hour" + (hoursSinceUpdate == 1 ? "" : "s") + " ago)";
        }
        $("#timeText").text(timeText);
    } else {
        $("#timeText").text('(checking data...)');
    }
}