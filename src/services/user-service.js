const UserRepository = require("../repository/user-repository");
const jwt = require("jsonwebtoken");
const { JWT_KEY } = require("../config/serverConfig");
const bcrypt = require("bcrypt");
const AppErrors = require("../utils/error-handler");
class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async create(data) {
    try {
      const user = await this.userRepository.create(data);
      return user;
    } catch (error) {
      if (error.name == "SequelizeValidationError") {
        throw error;
      }
      console.log("Something went wrong in the service layer");
      throw new AppErrors(
        "ServerError",
        "Something went wrong in Service",
        "Logical Issue found",
        500
      );
    }
  }

  async signIn(email, plainPassword) {
    try {
      // step 1 -> fetch the user using the email
      const user = await this.userRepository.getByEmail(email);
      //step 2 -> compare the incoming plain password with stored encrypted password
      const passwordsMatch = this.checkPassword(plainPassword, user.password);

      if (!passwordsMatch) {
        console.log("Passwords do not match");
        throw { error: "Incorrect password" };
      }
      //step 3 -> if passwords match, create a new JWT and send it to the user
      const newJWT = this.createToken({ email: user.email, id: user.id });
      return newJWT;
    } catch (error) {
      if (error.name === "AttributeNotFound") {
        throw error;
      }
      console.log("Something went wrong in the signIn process");
      throw error;
    }
  }
  async isAuthenticated(token) {
    try {
      const response = this.verifyToken(token);
      if (!response) {
        throw { error: "Token is not verified" };
      }
      const user = this.userRepository.getById(response.id);
      if (!user) {
        throw { error: "No user with the corresponding token exists." };
      }
      return user.id;
    } catch (error) {
      console.log("Something went wrong in the auth process");
      throw error;
    }
  }
  createToken(user) {
    try {
      const result = jwt.sign(user, JWT_KEY, { expiresIn: "1d" });
      return result;
    } catch (error) {
      console.log(
        "Something went wrong in creating the token in  the service layer"
      );
      throw error;
    }
  }

  verifyToken(token) {
    try {
      const response = jwt.verify(token, JWT_KEY);
      return response;
    } catch (error) {
      console.log(
        "Something went wrong in verifying the token in  the service layer",
        error
      );
      throw error;
    }
  }
  checkPassword(userInputPlainPassword, encryptedPassword) {
    try {
      return bcrypt.compareSync(userInputPlainPassword, encryptedPassword);
    } catch (error) {
      console.log(
        "Something went wrong in password comparison in the service layer"
      );
      throw error;
    }
  }
  isAdmin(userId) {
    try {
      return this.userRepository.isAdmin(userId);
    } catch (error) {
      console.log(
        "Something went wrong in the isAdmin process in the service layer"
      );
      throw error;
    }
  }
}

module.exports = UserService;
