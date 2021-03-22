FROM debian:buster

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN curl -fsSL https://deb.nodesource.com/setup_15.x | bash -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update \
    && apt-get install -y wget \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y fonts-noto-color-emoji nodejs yarn google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 ffmpeg \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /home/streamer
RUN groupadd streamer
RUN useradd -r -g streamer -G www-data -d /home/streamer streamer
RUN chown -R streamer:streamer /home/streamer

USER streamer
COPY index.js /home/streamer/index.js
COPY package.json /home/streamer/package.json
COPY yarn.lock /home/streamer/yarn.lock
COPY css /home/streamer/css

WORKDIR /home/streamer
RUN ["yarn","install"]

CMD ["node","index.js"]
