<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Base64 Challenge</title>
    <style>
        body {
            height: 96vh;
            background-image: url('./q4_background.jpg');
            background-repeat: no-repeat;
            background-size: cover;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column; /* 세로 중앙 정렬을 위해 추가 */
        }

        h1, p, label, input, button {
            text-align: center;
        }

        input {
            width: 51%;
        }
    </style>
</head>
<body>
    <br><br><br>
    <h1>64?</h1>
    
    <p>'REh7MGFZUG5HTmJ0MVBES01EU1JOTmNrWTZLYkJSeHlFMFc1dEJTZEBYJHF4Q2NBBVBCcGtWaWlndkhkQ0pFXmVFY30='</p><br>
    
    <input type="text" id="answer"><br>
    <button onclick="checkAnswer()">확인</button>

    <script>
        function checkAnswer() {
            const answer = document.getElementById("answer").value;
            const correctAnswer = 'DH{0aYPnGNbt1PDKMDSRNNckY6KbBRxyE0W5tBSd@X$qxCcAAPBpkViigvHdCJE^eEc}';

            if (answer === correctAnswer) {
                alert("정답입니다!");
            } else {
                alert("오답입니다. 다시 시도하세요.");
            }
        }
    </script>
</body>
</html>
