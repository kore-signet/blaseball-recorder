FROM debian:buster

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN curl -fsSL https://deb.nodesource.com/setup_15.x | bash -
RUN apt-get update \
    && apt-get upgrade \
    && apt-get install -y nodejs yarn python3 python3-pip python3-dev libczmq-dev gcc ffmpeg \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*



RUN python3 -m pip install --upgrade --no-cache pip wheel setuptools

RUN mkdir /home/streamer
RUN groupadd streamer
RUN useradd -r -g streamer -G www-data -d /home/streamer streamer
COPY --chown=streamer:streamer requirements.txt /home/streamer/requirements.txt
RUN python3 -m pip install -r /home/streamer/requirements.txt

RUN chown -R streamer:streamer /home/streamer

USER streamer
WORKDIR /home/streamer

COPY --chown=streamer:streamer archiver/ /home/streamer/archiver

WORKDIR /home/streamer/archiver/node
RUN ["yarn","install"]

WORKDIR /home/streamer
CMD ["python3","archiver/archiver.py"]
