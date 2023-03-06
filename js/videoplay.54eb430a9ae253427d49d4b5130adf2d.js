async function video_init() {
    const video1 = document.getElementById("vid1");
    const video2 = document.getElementById("vid2");
    // 음소거
    video1.muted = "muted";
    video2.muted = "muted";
    // 반복재생
    video1.loop = "loop";
    video2.loop = "loop";
    
    video1.autoplay = "autoplay";
    video2.autoplay = "autoplay";
    
    video1.play();
    video2.play();
}

video_init()