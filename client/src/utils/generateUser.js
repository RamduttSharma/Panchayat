export const getUser = () => {
    let user = sessionStorage.getItem("chatUser");

    if (!user) {
        let name = prompt("Enter your name:");

        if (!name) {
            name = "User_" + Math.floor(Math.random() * 1000);
        }

        const userObj = {
            id: Date.now() + Math.random(),
            name: name,
        };

        sessionStorage.setItem("chatUser", JSON.stringify(userObj));
        return userObj;
    }

    return JSON.parse(user);
};