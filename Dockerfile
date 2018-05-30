FROM kkarczmarczyk/node-yarn

ENV WORKDIR $HOME/app
ENV NODE_ENV development

EXPOSE 8881
WORKDIR $WORKDIR

RUN npm install --no-optional --global \
    mocha-cli \
    node-gyp

CMD ["yarn"]
CMD ["node", "main.js"]

ADD . $WORKDIR
VOLUME ["$WORKDIR"]
