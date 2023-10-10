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
    <link rel="stylesheet" href="../swiper.css"> 
</head>
<body>
        <!-- Slider main container -->
    <div class="swiper-container">
        <!-- Additional required wrapper -->
        <div class="swiper-wrapper">
            <!-- Slides -->
            <div class="swiper-slide">
                    <div class="text-wrap">
                        <h2>텍스트(문제이름)</h2><br>
                        <p>텍스트(부연설명?)</p>
                    </div>
                    <img src="..\q_images\Logo.jpg" alt="">
            </div>

            <div class="swiper-slide">
                    <div class="text-wrap">
                        <h2>텍스트</h2><br>
                        <p>텍스트</p>
                    </div>
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