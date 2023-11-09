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
                        <h2>Cokkies</h2><br>
                        <p>(Cookies)</p>
                    </div>
                    <img class="main-jpg" src="..\q_images\q3_Logo.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>쿠키란 ???</h2><br>
                        <hr size="5">
                        <p>컴퓨터 쿠키(Computer Cookies)는 인터넷에서 사용자의 활동과 정보를 추적하고 저장하는 작은 데이터 파일입니다.</p>
                        <p>이러한 쿠키는 웹 브라우저와 웹 서버 간의 통신을 통해 생성되며, 주로 웹사이트에서 사용자 경험을 개선하거나 사용자에 대한 정보를 기록하는 데 사용됩니다</p>
                        <p>1.세션 쿠키(Session Cookies): 사용자가 웹 사이트를 방문할 때 생성되며, 해당 세션 동안만 유지됩니다. 사용자가 웹 브라우저를 닫거나 로그아웃하면 세션 쿠키는 삭제됩니다.</p>
                        <p>2.지속 쿠키(Persistent Cookies): 사용자가 설정한 만료 날짜까지 유지되며, 사용자가 웹 사이트를 방문할 때마다 사용자 정보나 환경 설정과 같은 정보를 기록하는 데 사용됩니다.</p>
                        <p>쿠키 취약점은 웹 애플리케이션에서 쿠키를 관리하는 과정에서 발생할 수 있는 보안 결함을 나타냅니다.</p>
                        <p>이러한 결함은 해커가 사용자의 쿠키를 도용하거나 변조하여 부정한 접근을 시도하거나 사용자 정보를 탈취할 수 있게 합니다.</p>
                    </div>
                    <img class="help-image" src="..\q_images\q3_help_image1.jpg">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>Guest 접속(1)</h2><br>
                        <hr size="5">
                        <p>먼저 처음으로는 Guest로 접속해 봅니다 로그인, 비밀번호는 전부 guest로 통일되어 이미 나와있는 걸로 보입니다.</p>
                        <p>이 상태에서 로그인 버튼만 눌러주시면 됩니다.</p>
                    </div>
                    <img class="help-image" src ="..\q_images\q3_help_image2.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>Guest 접속(2)</h2><br>
                        <hr size="5">
                        <p>로그인을 하면 'You are Guest not admin'이라고 뜹니다 당연한 거 입니다.</p>
                        <p>guest에 접속을 했으니 지금 현재 guest 계정의 쿠키를 가지고 있는 거나 마찬가지입니다.</p>
                        <p>여기서 새로고침을 해도 guest 상태에 머물게 됩니다 쿠키는 이런 기능을 하게 됩니다.</p>
                        <p>설명을 듣는 거보다 직접 하니까 '쿠키'가 어떤 것인지 이해가 가나요?</p>
                    </div>
                    <img class="help-image" src ="..\q_images\q3_help_image3.jpg" alt="">
            </div>

            <div class="swiper-slide">
                <div class="help-text">
                    <h2>쿠키 변조(1)</h2>
                    <hr size="5">
                    <p>개발자 도구를 불러내어 응용 프로그램(Application Tab) 기능을 선택합니다.</p> 
                    <p>그다음 'Storage' 라인에 'Cookies'가 있습니다. 똑같이 클릭해 줍니다. </p>
                    <p>거기서 'Value' 값이 현재 'guest'로 되어 있는 걸 확인할 수 있습니다. 참고로 'Value'는 해당 쿠기의 값입니다.</p>
                    <p>'user'라는 쿠키 이름에 'guest'라는 값을 가지고 있습니다.</p>
                </div>
                <img class="help-image" src="..\q_images\q3_help_image4.jpg" alt="">
            </div>

            <div class="swiper-slide">
                <div class="help-text">
                    <h2>쿠키 변조(2)</h2>
                    <hr size="5">
                    <p>'user'이라는 쿠키 이름에 'guest'라는 값을 'admin'으로 변조해 보겠습니다.</p>
                    <p>그러면 'user'이라는 쿠키 이름에 'admin'이라는 값을 가지게 됩니다. </p>
                    <p>쿠키값을 변조하고 새로고침을 눌러 변조가 잘 되었는지 확인하면 됩니다.</p>
                </div>
                <img class="help-image" src="..\q_images\q3_help_image5.jpg" alt="">
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