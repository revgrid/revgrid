FROM mcr.microsoft.com/devcontainers/javascript-node:4-24-trixie

RUN \
    # Set up a directory for the node user's bash history and configure bash to use it
    mkdir -p /home/node/.container-bash-history && \
    chown -R node:node /home/node/.container-bash-history && \
    echo 'export HISTFILE=/home/node/.container-bash-history/.bash_history' >> /home/node/.bashrc && \
    echo 'export PROMPT_COMMAND="history -a"' >> /home/node/.bashrc && \
    echo 'export HISTSIZE=10000' >> /home/node/.bashrc && \
    echo 'export HISTFILESIZE=10000' >> /home/node/.bashrc
