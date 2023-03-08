// function pj1_video_init() {
//   const video1 = document.getElementById("vid1")
//   const video2 = document.getElementById("vid2")

//   // 음소거
//   video1.muted = true
//   video2.muted = true
//   // 반복재생
//   video1.loop = true
//   video2.loop = true
//   // 자동 재생
//   video1.autoplay = true
//   video2.autoplay = true

//   video1.play()
//   video2.play()
// }

// pj1_video_init()

async function pj1_video_init() {
  const video1 = document.getElementById("vid1");
  const video2 = document.getElementById("vid2");

  video1.muted = true;
  video2.muted = true;

  video1.loop = true;
  video2.loop = true;

  video1.autoplay = true;
  video2.autoplay = true;

  try {
    await Promise.all([video1.play(), video2.play()]);
  } catch (error) {
  }
}

pj1_video_init()