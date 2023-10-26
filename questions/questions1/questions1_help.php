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
                        <h2>개발자도구</h2><br>
                        <p>(Developer Tools)</p>
                    </div>
                    <img class="main-jpg" src="..\q_images\q1_Logo.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2> 개발자 도구란 ?        [단축키=F12]</h2><br>
                        <hr size="5">
                        <p>웹 브라우저에서 제공되는 도구 모음으로, 웹 개발자와 디자이너가 웹 페이지를 분석하고 디버깅하는 데 도움을 주는 기능을 제공합니다
                            이 도구를 통해서 다양한 브라우저에서 사용할 수 있으며, 주로 웹 사이트의 구조,동작,성능을 확인하고 개선하기 위해서 활용됩니다.</p>
                        <p> 요소 검사(Elements Tab): 웹 페이지의 HTML 및 CSS를 검사하고 편집할 수 있습니다. 이를 통해 웹 페이지의 요소들을 선택하고 스타일을 변경할 수 있습니다.<br><br>
                            콘솔(Console Tab): JavaScript 코드를 실행하고 디버깅할 수 있는 콘솔입니다. 오류 메시지를 확인하거나 변수 값을 출력하는 데 사용됩니다.<br><br>
                            네트워크(Network Tab): 웹 페이지가 로드될 때 발생하는 네트워크 요청과 응답을 모니터링할 수 있습니다. 이를 통해 웹 페이지의 성능 문제를 파악하고 최적화할 수 있습니다.<br>
                            소스(Sources Tab): 웹 페이지의 JavaScript, CSS, 및 기타 리소스의 소스 코드를 검사하고 디버깅할 수 있습니다. 브레이크포인트를 설정하고 코드 실행을 일시 중지시킬 수 있습니다.<br><br>
                            응용 프로그램(Application Tab): 로컬 스토리지, 세션 스토리지, 쿠키, 서비스 워커 등과 같은 웹 애플리케이션의 로컬 데이터를 관리하고 검사할 수 있습니다.<br><br>
                            성능(Performance Tab): 웹 페이지의 성능을 평가하고 분석하는 도구로, 페이지 로딩 시간과 렌더링 속도 등을 확인할 수 있습니다.<br><br>
                            보안(Security Tab): 웹 페이지의 보안 관련 정보를 확인할 수 있으며, SSL/TLS 연결 및 보안 정책을 검사할 수 있습니다.<br><br>
                            요청 내력(Inspector History): 이전에 요청한 페이지 및 관련 정보를 기록하고 검토할 수 있습니다.<br><br>
                            모바일(Emulation): 모바일 기기에서 웹 페이지를 에뮬레이트하고 테스트하는 데 사용됩니다.</p>
                    </div>
                    <img class="help-image" src="..\q_images\q1_help_image1.jpg">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>요소 검사 (Elements Tab)</h2><br>
                        <hr size="5">
                        <p>첫 번째 문제는 '요소 검사 (Elements Tab)'를 통해 문제를 풀어보도록 하겠습니다.</p>
                        <p>먼저 단축키 'F12'를 눌러 개발자 도구를 불러냅니다 버튼을 누르면 옆에 있는 이미지와 똑같이 나옵니다.</p><br>
                        
                    </div>
                    <img class="help-image" src ="..\q_images\q1_help_image2.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="text-wrap">
                        <h2>텍스트</h2><br>
                        <p>텍스트</p>
                    </div>
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