<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Help_5</title>
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
                        <h2>Regular expression</h2><br>
                        <p>(정규표현식)</p>
                    </div>
                    <img class="main-jpg" src="..\q_images\q5_Logo.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>정규표현식</h2><br>
                        <hr size="5">
                        <p>정규표현식(Regular Expression 또는 간단히 Regex)은 문자열의 패턴을 표현하는데 사용되는 형식 언어입니다.</p>
                        <p>주로 문자열에서 특정한 문자 조합이나 패턴을 찾거나 추출할 때 유용하게 활용됩니다.</p>
                        <p>정규표현식은 다양한 프로그래밍 언어와 텍스트 편집기에서 지원되며, 많은 문자열 작업을 간편하게 수행할 수 있도록 도와줍니다</p>
                        <p>(솔직히 너무 많아서 구글링이 빠릅니다...)</p>
                    </div>
                    <img class="help-image" src="..\q_images\q5_help_image1.jpg">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>정규표현식2</h2><br>
                        <hr size="5">
                        <p>문자 클래스([]): 대괄호 안에 들어가는 문자들 중 하나와 매치됩니다 -> [aeiou]: 소문자 모음과 매치됩니다.</p>
                        <p>범위(-): 대괄호 안에서 사용되며, 범위를 나타냅니다 -> [0-9]: 모든 숫자와 매치됩니다.</p>
                        <p>점(.): 어떤 한 개의 문자와 매치됩니다. 단, 새 줄 문자('\n')는 제외합니다.</p>
                        <p>a.b: "a" 다음에 어떤 문자든 하나, 그리고 다시 "b"가 나오는 패턴과 매치됩니다.</p>
                        <p>반복(*, +, ?): 앞에 나오는 문자나 그룹이 0번 이상, 1번 이상, 0 또는 1번 등으로 반복되는 패턴을 표현합니다.</p>
                        <p>ca*t: "ct", "cat", "caat", "caaat" 등과 매치됩니다.</p>
                        <p>그룹화(()): 괄호 안에 있는 부분을 하나의 그룹으로 묶어 표현합니다 -> (ab)+: "ab", "abab", "ababab" 등과 매치됩니다.</p>
                        <p>백슬래시(): 특수문자를 이스케이프하거나, 특수한 의미를 가진 문자로 사용합니다.</p>
                        <p>\d: 숫자와 매치됩니다.</p>
                        <p>앵커(^, $): 문자열의 시작(^)이나 끝($)을 나타냅니다.</p>
                        <p>^abc: "abc"로 시작하는 문자열과 매치됩니다.</p>
                        <p>OR(|): 주어진 문자열 중 하나와 매치됩니다. -> cat|dog: "cat" 또는 "dog"와 매치됩니다.</p>
                    </div>
                    <img class="help-image" src ="..\q_images\q5_help_image2.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>문제풀이</h2><br>
                        <hr size="5">
                        <p>옆에 이미지는 정규표현식의 이해를 돕기 위해 정규표현식을 입력하면 시각화효과를 입혀줬다 구글에 Regexper를 검색하면 된다.</p>
                        <p>^: 문자열의 시작이 패턴이 문자열의 맨 앞에 와야 합니다. 그래야 패턴이 일치합니다 -> [\w.%+\-]+: 사용자 이름 부분</p>
                        <p>여기서 [\w.%+\-]은 알파벳 대소문자, 숫자, 밑줄(_), 마침표(.), 퍼센트(%), 플러스(+), 대시(-) 중 하나 이상의 문자와 일치합니다.</p>
                        <p>+는 앞에 나오는 패턴이 하나 이상의 문자와 일치해야 한다는 뜻입니다.</p>
                        <p>@: 이메일 주소에서 사용되는 일반적인 기호 -> 그냥 @가 있는 곳입니다. 이메일 주소에서는 이 기호가 반드시 필요합니다.</p>
                        <p>[\w.\-]+: 도메인 부분 -> 여기서 [\w.\-]은 알파벳 대소문자, 숫자, 마침표(.), 대시(-) 중 하나 이상의 문자와 일치합니다.</p>
                        <p>+는 앞에 나오는 패턴이 하나 이상의 문자와 일치해야 한다는 뜻입니다.</p>
                        <p>\.: 도메인과 상위 도메인 사이의 점 -> 이 부분은 도메인과 최상위 도메인(TLD)을 구분하는 점(.)입니다.</p>
                        <p>[A-Za-z]{2,3}: 최소 두 글자 이상의 최상위 도메인 -> 여기서 [A-Za-z]은 알파벳 대소문자 중 하나와 일치합니다.
                        <p>{2,3}는 두 글자 이상 세 글자 이하의 반복을 나타냅니다.
                        <p>$: 문자열의 끝</p>
                    </div>
                    <img class="help-image" src ="..\q_images\q5_help_image3.jpg" alt="">
            </div>

            <div class="swiper-slide">
                <div class="help-text">
                    <h2>문제풀이2</h2>
                    <hr size="5">
                    <p>자신감이 많이 떨어지신거 같은데 원래 어렵습니다.</p>
                    <p>굉장히 어려운 게 맞습니다 정규표현식은 범위가 넓기 때문에 답도 정해져 있지도 않습니다.</p>
                    <p>눈치를 채신 분들이 있겠지만 이 정규표현식 패턴은 이메일 주소입니다.</p>
                    <p>이메일 주소를 입력하면 Flag값을 나오게 했습니다</p>
                </div>
                <img class="help-image" src="..\q_images\q5_help_image4.jpg" alt="">
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