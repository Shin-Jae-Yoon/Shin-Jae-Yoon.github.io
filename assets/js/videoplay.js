function pj1_video_init() {
  const video1 = document.getElementById("vid1")
  const video2 = document.getElementById("vid2")

  // 음소거
  video1.muted = true
  video2.muted = true
  // 반복재생
  video1.loop = true
  video2.loop = true
  // 자동 재생
  video1.autoplay = true
  video2.autoplay = true

  video1.play()
  video2.play()
}

pj1_video_init()

// async function pj1_video_init() {
//     const video1 = document.getElementById("vid1");
//     const video2 = document.getElementById("vid2");

//     try {
//       const response1 = await fetch("/images/project_01_video02.mp4");
//       const videoData1 = await response1.blob();
//       video1.src = URL.createObjectURL(videoData1);
//       video1.autoplay = true;
//       video1.loop = true;
//       video1.muted = true;

//       const response2 = await fetch("/images/project_01_video03.mp4");
//       const videoData2 = await response2.blob();
//       video2.src = URL.createObjectURL(videoData2);
//       video2.autoplay = true;
//       video2.loop = true;
//       video2.muted = true;
//     } catch (err) {
//     //   console.error("Error: ", err);
//     }
//   }

// pj1_video_init()
