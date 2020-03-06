<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A "file" in a user's directory; actually either a file or a subdirectory.
 */
class File
{
  /**
   * The user who owns the file.
   *
   * @var User
   */
  private $user;

  /**
   * The file's type (tbas|tpas|tpy|txt|dir).
   *
   * @var string
   */
  private $type;

  /**
   * The file's name.
   *
   * @var string|null
   */
  private $name;

  /**
   * The file's contents (text if it's a genuine file, an array of files if it's a directory).
   *
   * @var string|File[]|null
   */
  private $contents;

  /**
   * The file itself (a temporary property used when uploading).
   *
   * @var UploadedFile|null
   * @Assert\File(maxSize="4096k", maxSizeMessage="This file is too big.")
   */
  private $file;

  /**
   * The size of the file.
   *
   * @var int|null
   */
  private $size;

  /**
   * Constructor function.
   *
   * @param User $user
   */
  public function __construct(User $user, string $type)
  {
    $this->user = $user;
    $this->type = $type;
    $this->name = null;
    $this->contents = null;
    $this->size = null;
    $this->file = null;
  }

  /**
   * Get the user who owns the file.
   *
   * @return User
   */
  public function getUser(): User
  {
    return $this->owner;
  }

  /**
   * Get the file's type.
   *
   * @return string
   */
  public function getType(): string
  {
    return $this->type;
  }

  /**
   * Get the file's name.
   *
   * @return string|null
   */
  public function getName(): ?string
  {
    return $this->name;
  }

  /**
   * Set the file's name.
   *
   * @param string $name
   * @return self
   */
  public function setName(string $name): self
  {
    $this->name = $name;
    return $this;
  }

  /**
   * Get the file's contents.
   *
   * @return string|File[]|null
   */
  public function getContents()
  {
    return $this->contents;
  }

  /**
   * Set the file's contents (for a text file).
   *
   * @param string $contents
   * @return self
   */
  public function setTextContents(string $contents): self
  {
    $this->contents = $contents;
    return $this;
  }

  /**
   * Add a file to the file's contents (for a directory).
   *
   * @param File $file
   * @return self
   */
  public function addFileContents(File $file): self
  {
    if (!is_array($this->contents)) {
      $this->contents = [];
    }
    $this->contents[] = $file;
    return $this;
  }

  /**
   * Get the uploaded file.
   *
   * @return UploadedFile|null
   */
  public function getFile(): ?UploadedFile
  {
    return $this->file;
  }

  /**
   * Set the uploaded file.
   *
   * @param UploadedFile|null
   * @return self
   */
  public function setFile(?UploadedFile $file = null): self
  {
    $this->file = $file;
    return $this;
  }

  /**
   * Get the size of the file (as a string).
   *
   * @param bool $formatted
   * @param int $precision
   * @return string
   */
  public function getSize(bool $formatted = false, int $precision = 2): string
  {
    $bytes = $this->size;
    if ($formatted) {
      $kilobyte = 1024;
      $megabyte = $kilobyte * 1024;
      if ($bytes < $kilobyte) {
        $bytes = $bytes.' B';
      } elseif ($bytes < $megabyte) {
        $bytes = round($bytes / $kilobyte, $precision).' KB';
      } else {
        $bytes = round($bytes / $megabyte, $precision).' MB';
      }
    }
    return (string) $bytes;
  }

  /**
   * Set the size of the file.
   *
   * @param int $size
   * @return self
   */
  public function setSize(int $size): self
  {
    $this->size = $size;
    return $this;
  }

  /**
   * Get whether the file is a Turtle program.
   *
   * @return bool
   */
  public function isProgram(): bool
  {
    $exts = ['tbas', 'tpas', 'tpy', 'tgx'];
    if ($this->type) {
      return in_array($this->type, $exts);
    }

    if ($this->file) {
      $nameparts = pathinfo($this->file->getClientOriginalName());
      return in_array($nameparts['extension'], $exts);
    }

    return false;
  }
}
