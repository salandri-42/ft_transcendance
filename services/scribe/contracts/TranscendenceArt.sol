// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TranscendenceArt
 * @dev NFT contract pour les œuvres créées avec le Dé
 */
contract TranscendenceArt is ERC721, ERC721URIStorage, Ownable {
    
    uint256 private _nextTokenId;

    struct Artwork {
        address artist;
        uint256 timestamp;
        string title;
    }

    mapping(uint256 => Artwork) public artworks;
    
    event ArtworkMinted(
        uint256 indexed tokenId,
        address indexed artist,
        string tokenURI
    );
    
    constructor(address initialOwner)
        ERC721("Transcendence Artwork", "TART")
        Ownable(initialOwner)
    {
        _nextTokenId = 1;
    }
    
    function safeMint(address to, string memory uri, string memory title)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        artworks[tokenId] = Artwork({
            artist: to,
            timestamp: block.timestamp,
            title: title
        });

        emit ArtworkMinted(tokenId, to, uri);
        return tokenId;
    }

    function getArtwork(uint256 tokenId)
        public
        view
        returns (address, uint256, string memory)
    {
        Artwork memory art = artworks[tokenId];
        return (art.artist, art.timestamp, art.title);
    }
    
    function tokensOfOwner(address owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        uint256 index = 0;
        for (uint256 tokenId = 1; tokenId < _nextTokenId; tokenId++) {
            if (_ownerOf(tokenId) == owner) {
                tokenIds[index] = tokenId;
                index++;
            }
        }
        
        return tokenIds;
    }
    
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}