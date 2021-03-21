docker build -t blaseball-recorder/archiver --build-arg USER_ID=$(id -u) --build-arg GROUP_ID=$(id -g) archiver
docker build -t blaseball-recorder/streamer --build-arg USER_ID=$(id -u) --build-arg GROUP_ID=$(id -g) recorder 
