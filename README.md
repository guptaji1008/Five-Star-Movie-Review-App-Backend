
# 5 Star MRP  - Movie Review App (Backend)

This is the backend part of my full stack Movie Review App where I have used Express as node framework, MongoDb as my database.


## Introduction

This is backend part, where I have used five different end points for routing. I have used middlewares where firstly data goes through for validation process. I have used six types of collections that are Movies, Actors, Users, Reviews, emailVerifications, forgotPassword and I have used bcrypt for password encription and jsonwebtoken for token generation for authentication, which eases users life. Basically whenever new user signups, a token is generated and this backend part consist some logic by which, after signup a token will be generated and this token will get stored in local storage, which will help you not logging in everytime until you logout.
## Technologies

1. bcrypt 5.1.1
2. cloudinary 1.41.0
3. cors 2.8.5
4. dotenv 16.3.1
5. express 4.18.2
6. express-async-errors 3.1.1
7. express-validator 7.0.1
8. jsonwebtoken 9.0.2
9. mongoose 7.5.3
10. multer 1.4.5-lts.1
11. nodemailer 6.9.5
