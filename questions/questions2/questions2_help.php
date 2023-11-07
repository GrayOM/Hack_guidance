<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.css" />
    <link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.min.css" />
    <script src="https://unpkg.com/swiper/swiper-bundle.js"></script>
    <script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../swiper.css">
</head>
<body>
        <!-- Slider main container -->
    <div class="swiper-container">
        <!-- Additional required wrapper -->
        <div class="swiper-wrapper">
            <!-- Slides -->
            <div class="swiper-slide">
                    <div class="main-text-wrap">
                        <h2>Reading Code</h2><br>
                        <p>(Source Code Editor)</p>
                    </div>
                    <img class="main-jpg" src="..\q_images\q2_Logo.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>소스 코드 편집기란 ?</h2><br>
                        <hr size="5">
                        <p>소스 코드 편집기(source code editor)는 프로그래머에 의해 컴퓨터 프로그램의 소스 코드를 편집하기 위해 설계된 프로그램의 하나이다.</p>
                        <p>독립적인 애플리케이션일 수도 있고, 통합 개발 환경(IDE)이나 웹 브라우저에 통합되어 있는 경우도 있다. 소스 코드 편집기들은 가장 근본적인 프로그래밍 도구인데</p>
                        <p>프로그래머들의 근본적인 작업이 소스 코드를 작성하고 편집하는 일이기 때문이다.</p>
                        <p>흔히 알고 있는 (Visual Studio Code) , (Visual Studio) , IntelliJ , Notepad++ 등등이 있다.</p>
                        <p>이번 문제를 풀기 위해서는 이 소스코드 편집기가 필요합니다.</p>
                    </div>
                    <img class="help-image" src="..\q_images\q2_help_image1.jpg">
            </div>
            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>개발자 도구로?</h2><br>
                        <hr size="5">
                        <p>1번 문제를 풀었던 것처럼 개발자도구에 요소 검사를 통해 확인해 보면</p>
                        <p> 이번 문제는 보이지 않는 걸로 확인이 됩니다.</p>
                    </div>
                    <img class="help-image" src ="..\q_images\q1_help_image2-1.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>편집기 연결</h2><br>
                        <hr size="5">
                        <p>먼저 문제를 풀기 앞서 문제 다운로드를 하도록 하자 현재 제가 쓰고 있는 편집기는 vscode입니다.</p>
                        <p>어려운 거 없이 그냥 문제를 다운로드하면 편집기에 끌어다가 놓으면 문제 2번 코드가 고스란히 보입니다. </p>
                        <p>그중 저희가 찾아야 하는 건 역시 패스워드와 관련이 있는 코드입니다.</p>
                    </div>
                    <img class="help-image" src ="../q_images/q1_help_image3-1.jpg" alt="">
            </div>

            <div class="swiper-slide">
                <div class="help-text">
                    <h2>Code Reading</h2>
                    <hr size="5">
                    <p>다른 HTML,CSS 는 넘기고 바로</p>
                </div>
            </div>
        <!-- If we need pagination -->
        <div class="swiper-pagination"></div>

        <!-- If we need navigation buttons -->
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>

<script src="../questions.js"></script>
</body>

</html>