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
                        <h2>Base64</h2><br>
                        <p>(base64)</p>
                    </div>
                    <img class="main-jpg" src="..\q_images\q4_Logo.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>Base64 ??</h2><br>
                        <hr size="5">
                        <p>Base64는 이진 데이터를 텍스트 형식으로 변환하는 인코딩 체계 중 하나입니다. </p>
                        <p>이는 주로 이진 데이터를 텍스트로 변환하여 다른 시스템에서도 쉽게 처리하거나 전송할 수 있도록 하는데 사용됩니다.</p>
                        <p>Base64는 특히 이메일 첨부 파일이나 웹에서 이미지를 전송하는 등의 상황에서 자주 사용됩니다</p>
                        <p>Base64는 64개의 문자로 이루어진 문자열을 사용하며, 이는 영문 대소문자 52개와 숫자 10개, 그리고 '+', '/' 두 개의 특수 문자로 이루어져 있습니다.<p><br>

                        <p>Base64의 주요 특징은 다음과 같습니다</p>
                        <p>인코딩: 이진 데이터를 Base64로 인코딩하면 각 6비트의 이진 숫자를 하나의 Base64 문자로 변환됩니다. 따라서 3바이트의 이진 데이터는 4개의 Base64 문자로 변환됩니다.</p>
                        <p>디코딩: Base64로 인코딩된 문자열을 디코딩하면 각 4개의 Base64 문자가 3바이트의 이진 데이터로 변환됩니다.</p>
                        <p>텍스트로 변환: Base64는 이진 데이터를 텍스트로 변환하기 때문에 텍스트 데이터로 전송하거나 저장할 때 유용합니다.</p>
                    </div>
                    <img class="help-image" src="..\q_images\q4_help_image1.jpg">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>보안하고 무슨상관?</h2><br>
                        <hr size="5">
                        <p>Base64는 이진 데이터를 텍스트 형식으로 변환하는 인코딩 체계 중 하나입니다.</p>
                        <p>그리고 Base64는 암호화가 아닙니다 그러면 이걸 왜 문제로 만들었냐고 의문이 드실 텐데 Base64는 어떻게 보면 컴퓨터 과학과 관련이 있습니다 그리고 정보보안은 컴퓨터과학에 밀접한 연관이 있습니다.</p>
                        <p>개인적으로 정보보안에 대해서 깊게 파고들어 가시려면 컴퓨터 과학이 받쳐줘야지 그만큼 실력이 향상한다고 들었습니다</p>
                        <p>다시 이제 문제를 풀어보겠습니다.</p>
                    </div>
                    <img class="help-image" src ="..\q_images\q4_help_image2.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="help-text">
                        <h2>Base64-1</h2><br>
                        <hr size="5">
                        <p>이번 문제는 아주 심플합니다 인코딩 되어있는 문자열을 다시 디코딩하면 됩니다.</p>
                        <p>인코딩을 말로 쉽게 표현하자면 '문자 또는 문자열을 바이트형식으로 변환'시키는 겁니다 디코딩은 '바이트형식을 문자 또는 문자열로 변환' 시킵니다. </p>
                        <p>하지만 디코딩을 사람이 하기에는 시간이 많이 소요되고 실수할 가능성이 너무 높아 컴퓨터를 이용해 보도록 하겠습니다.</p>
                    </div>
                    <img class="help-image" src ="..\q_images\q4_help_image3.jpg" alt="">
            </div>

            <div class="swiper-slide">
                <div class="help-text">
                    <h2>Base64-2</h2>
                    <hr size="5">
                    <p>요즘에는 Base64 디코딩을 해주는 사이트도 있어서 그것을 이용하면 바로 문제가 풀리겠지만 그래도 문제풀이하는데 다른 사이트 들어가서 '딸깍' 해서 문제풀이는 보여드리고 싶지 않기에 간단한 pytohn 코드를 짜봤습니다.</p>
                    <p>python에서 'base64' 모듈을 사용하여 문제를 풀어봤습니다.</p><br>
                    <p>일단 'encoded_string'라는 변수에 문제로 받은 Base64 문자열을 저장해 주고 'decoded_bytes'에 다가 Base64로 인코딩 된 문자열을 디코딩하고 , 결과를 바이트 객체로 만들었습니다</p>
                    <p>'decoded_string'에 다시 디코딩된 바이트객체를 UTF-8 문자열로 디코딩하여 저장시키고 출력시킵니다.</p>
                    <p>출력시키면 답이 나옵니다.</p>
                </div>
                <img class="help-image" src="..\q_images\q4_help_image4.jpg" alt="">
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