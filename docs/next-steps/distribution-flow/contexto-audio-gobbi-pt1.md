Então, a gente tem aqui dois fluxos de... Nós temos dois fluxos de distribuição de vídeos na fila de produção. Qual que é a ideia? A ideia do primeiro é fazer apenas check e uma limitação, como se fosse uma catraca que vai passar vídeo por vez.

Então existe campo na tabela production videos Que tem lá campo boleano dizendo se ele está processando ou não Então o vídeo que estiver processando vai ter esse campo marcado como true, como verdade E aí se tiver algum campo processando, algum vídeo dentro todos, ele vai pausar E esse fluxo aqui Ele roda de 2 em 2 minutos com o Chrome Aí ele vai passando 2 em 2 minutos Quando acaba de processar o vídeo Logicamente lá no final do fluxo Eu marco ele como Is processing igual a False Aí o próximo Chrome Vai identificar que não tem nenhum Vídeo sendo processado E vai passar adiante Limitando a 1 de cada vez Mas Mas é isso, né?

Ele passa lá de cada vez Só que se eu demoro A começar a produção do vídeo O que vai acontecer? Ele pode passar mais de Pro fluxo adiante Então isso aqui já pode estar acontecendo Beleza, então a ideia dessa catraca É deixar apenas produzindo de cada vez Beleza?

Aí ele joga para o fluxo de match O fluxo de match é onde a gente vai fazer O pareamento entre O... O vídeo que a gente quer produzir E o canal para o qual ele vai ser destinado E existe uma categoriza que feita Tem JSONB de categorization dentro da Production Videos existe em v lugares na verdade que uma categoriza do v para a gente saber o seguinte cara v relacionado a hist ele apto a ser produzido por quais canais ou numa outra perspectiva.

Quais são os canais que você tem, que você protocolou na sua tabela como canais seus que você controla, que estão elegíveis a receber vídeo de histórias? E esse match, ele é feito através desse JSONB de categorization. Então, se eu tenho vídeo que eu levei para a produção que tem a categorization de niche ou subniche que bate com o niche ou subniche do canal, ele se torna par elegível.

E aí eu posso ter vídeo de histórias e eu posso ter 30 canais de histórias. E nessa etapa eu vou ser perguntado perguntado se eu quero pegar este vídeo e produzir para os 30 canais ou para 25 ou para 5 ou para 10, ou seja, eu vou ter a lista completa de canais elegíveis a receber aquele vídeo e eu simplesmente vou escolher de forma manual.

Uma feature futura seria a gente colocar isso de forma automática, mas por enquanto ainda é manual e nesse processo manual eu recebo e-mail no gmail, que é o human in the loop a parte do human in the loop desse fluxo que lá no e-mail eu vou receber e-mail dizendo que tem vídeo para ser distribuído, vamos dizer assim ou multiplicado e por que multiplicado?

porque eu posso pegar vídeo e multiplicar para 10 canais, por exemplo e lá eu vou escolher então tem todo fluxozinho envolvendo o formulário do pr N8N que muito ruim que l do e eu vou receber aviso eu vou escolher para onde aquele v vai ser produzido beleza E aí, quando eu faço isso, ele vai multiplicar esse vídeo, o que isso significa?

Se eu escolher cinco vídeos, cinco canais de destino que irão produzir aquele mesmo vídeo, obviamente aproveitando a força narrativa dele, não os detalhes específicos, ele vai criar cinco linhas diferentes, ou seja, cinco entradas, cinco vídeos a serem produzidos para os cinco canais diferentes com o mesmo benchmark video, que é esse vídeo de modelo que entrou no sistema.

Vou dar exemplo para ficar claro. Eu tenho vídeo, por exemplo, de empregada que é humilhada por bilionário E depois ela é exaltada Ou seja, uma história simples de redenção, vamos dizer assim Ou de vingança, onde ela sai por cima no final A pessoa de baixo status social, ela sai como exaltada no final do vídeo Essa é uma temática muito... é arquétipo narrativo muito comum nesses vídeos de YouTube E aí imagina que eu tenho canal que vai usar esse mesmo arquétipo poderoso numa temática militar.

Esse mesmo arquétipo poderoso numa temática, sei lá, de mundo animal. Essa mesma coisa numa temática de 1940. Essa mesma coisa temática de latinos nos Estados Unidos. E por aí vai.

Ou seja, eu tenho micronichos diferentes dentro do mesmo nicho que poderiam se aproveitar daquela narrativa poderosa. E é exatamente isso que nós estamos buscando fazer aqui. Distribuir esse vídeo, ou melhor, multiplicar esse vídeo para aproveitar a força narrativa dele em diferentes micronichos. Porque teoricamente se voc tem v que tem arqu narrativo muito forte que funciona faz sentido a gente trocar a roupagem dele Legal?

Para isso que a gente tem match, para poder dizer qual canal é elegível a receber aquele vídeo com matching de nicho e subnicho, que está contido dentro do JSONB estruturado da coluna categorization. É nóis? É isso daí. É isso que a gente precisa criar. Essa mecânica de seleção.

Essa mecânica de seleção. De match e seleção manual. No primeiro momento. Depois a gente pode ter uma chavinha que vai fazer a seleção automática. O que seria automática?

Ele automaticamente multiplicaria este vídeo por todos os canais que fossem elegíveis. De forma automática. Já fazendo toda essa seleção de forma automática. Legal? E aí nós podemos ter já uma ideia, uma blacklist, por exemplo, e uma whitelist. O que eu quero dizer?

Ao invés de multiplicar, se eu tiver 30 canais, pode ser que 5 destes canais eu já tenha abandonado. Então eu não quero gastar tempo produzindo para eles. E aí eu vou lá e coloco eles na blacklist da parte automática. e os outros 25 eles vão receber o vídeo normalmente porque eles não estão na blacklist então para sistema automático poderia ter essa feature aí legal tá ok meu patrão?
