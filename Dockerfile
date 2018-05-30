FROM kkarczmarczyk/node-yarn

ENV NODE_ENV development
ENV TERM xterm-256color

ENTRYPOINT ["/usr/app/Dockerfile_entrypoint.sh"]

EXPOSE 8881
WORKDIR /usr/app

ADD . /usr/app
VOLUME /usr/app
