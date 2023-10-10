<!DOCTYPE html>
<html lang="ko">
<head>
  
  
  
</head>
<body>
    <?php
        setcookie("user","guest",time()+3600);
    ?>
      

  <?php
  if ($_COOKIE['user']=='admin') {
    
      
          echo "<script>alert('Flag:245360283758230587935');</script>";
      
  }
  else{
    echo"<script>alert('관리자로 접근하세요');</script>";
      
  }

 
  ?>
</body>
</html>