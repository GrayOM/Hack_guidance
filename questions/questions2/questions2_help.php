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
                    <img class="help-image" src ="..\q_images\q2_help_image2.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>편집기 연결</h2><br>
                        <hr size="5">
                        <p>먼저 문제를 풀기 앞서 문제 다운로드를 하도록 하자 현재 제가 쓰고 있는 편집기는 vscode입니다.</p>
                        <p>어려운 거 없이 그냥 문제를 다운로드하면 편집기에 끌어다가 놓으면 문제 2번 코드가 고스란히 보입니다. </p>
                        <p>그중 저희가 찾아야 하는 건 역시 패스워드와 관련이 있는 코드입니다.</p>
                    </div>
                    <img class="help-image" src ="..\q_images\q2_help_image3.jpg" alt="">
            </div>

            <div class="swiper-slide">
                <div class="help-text">
                    <h2>Code Reading</h2>
                    <hr size="5">
                    <p>코드를 넘기다 보면 또 이렇게 'DM~'으로 시작하는 문자열이 보이실 겁니다. 이러면 1번 문제를 푸셨다면 눈치를 채시겠지만 이 코드가 핵심코드인건 아셨을겁니다.</p>
                    <p>코드를 한번 해석해 보자면</p><br>
                    <p>1.if (isset($_POST["login"])) {: 이 라인은 POST 요청에서 "login" 파라미터가 전송되었는지 확인합니다. 일반적으로 로그인 양식에서 "login" 버튼을 클릭하면 이 POST 요청이 생성됩니다.</p>
                    <p>2.$username = $_POST["id"];: 이 라인은 POST 요청에서 "id" 파라미터의 값을 가져와서 $username 변수에 할당합니다.</p>
                    <p>3.$password = $_POST["pw"];: 이 라인은 POST 요청에서 "pw" 파라미터의 값을 가져와서 $password 변수에 할당합니다.</p>
                    <p>4.$validUsername = "haaaaackckck"; 및 $validPassword = "errrrsssssss";: 이 두 라인은 코드에서 하드 코딩된 유효한 사용자 이름과 비밀번호를 정의합니다.</p>
                    <p>5.if ($username == $validUsername && $password == $validPassword) {: 이 라인은 사용자가 입력한 사용자 이름과 비밀번호가 $validUsername 및 $validPassword와 일치하는지 확인합니다. 일치하는 경우 아래의 코드 블록이 실행됩니다.</p>
                    <p>6.echo "alert('DH{3325$(*#13*129824579@');";: 이 라인은 JavaScript alert 함수를 사용하여 메시지를 출력합니다. 메시지는 'DH{3325$(*#13*129824579@'로 정의되어 있습니다.</p>
                    <p>7.echo "alert('떙.')";: 이 라인은 JavaScript alert 함수를 사용하여 다른 메시지인 '떙.'을 출력합니다. 이것은 유효하지 않은 로그인을 시도했을 때 표시되는 메시지입니다.</p>
                </div>
                <img class="help-image" src="..\q_images\q2_help_image4.jpg" alt="">
            </div>

            <div class="swiper-slide">
                <div class="help-text">
                    <h2>Main Code Reading</h2>
                    <hr size="5">
                    <p>코드에 대한 설명이 너무 복잡할 수 있다고 생각합니다 Main code를 찾긴 찾았는데 '어떤 부분이 Password 하고 직접적인 연관이 있나?'라고 궁금해하실 수도 있다고 생각이 들어서 좀 더 쉽고 더 깊이 보자면 이전 슬라이드 설명에 보면 Main code에 숫자를 매겨 설명해 놓을걸 보실 수 있습니다 그중에서 저희는 4,5번을 확인해 보겠습니다 </p>
                    <p>5번부터 설명하면 if ($username == $validUsername && $password == $validPassword)라는 코드가 있는데 이걸 쉽게 설명하면 지정된 $username과 $validUsername 이 서로 같은지 여부를 확인하는 과정입니다 옆에 있는 password 도 똑같은 말이 되겠죠 여기서 보면 '&&'라고 특수 문자가 있는데 이것은 '논리 연산자'라고 불리며 서로 같을 때를 물어보는 겁니다.</p>
                    <p>저희가 게임할 때 쇼핑을 할 때 아이디와 비밀번호를 입력하면 로그인이 되는 과정에 사용자가 설정한 아이디와 비밀번호가 동시에 같아야지 사용자의 대한 정보를 꺼내 누구인지 확인이 가능하겠죠? 똑같은 겁니다. </p>
                    <p>4번를 확인해 보면 $validUsername = "haaaaackckck"; 및 $validPassword = "errrrsssssss" 코드를 보면 5번 하고 비슷해 보입니다.</p>
                    <p>$validUsername 은 "Haaaaackckck"라고 지정되어 있다고 아시면 됩니다 반대로 password 쪽도 같겠죠 </p>
                    <p>종합적으로 보면 ID 칸에 "haaaaackckck", PW 칸에 "errrrsssssss"를 입력하면 된다는 사실을 알 수 있습니다.</p>
                </div>
                <img class="help-image" src="..\q_images\q2_help_image5 .jpg" alt="">
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