const User = require("../models/User");
const bcrypt = require("bcrypt");


exports.register = async (req, reply) => {
  try {
    const { password, ...data } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      ...data,
      password: hashedPassword
    });
    reply.send({ message: "User registered", user });
  } catch (err) {
    reply.code(400).send({ error: err.message });
  }
};
exports.login = async (req, reply) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return reply.code(401).send({ error: "Invalid email" });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return reply.code(401).send({ error: "Invalid password" });
  }
  const token = reply.jwtSign({
    id: user._id,
    email: user.email
  });
  reply.send({ token });
};